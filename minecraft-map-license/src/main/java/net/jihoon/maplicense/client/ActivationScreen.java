package net.jihoon.maplicense.client;

import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;
import net.jihoon.maplicense.net.ActivateRequestC2S;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.client.gui.widget.TextFieldWidget;
import net.minecraft.client.input.KeyInput;
import net.minecraft.text.Text;
import org.lwjgl.glfw.GLFW;

/**
 * The prompt an unlicensed player sees on entering the protected map.
 *
 * <p>Escape does not close it and the game keeps ticking behind it, because the
 * server-side lock relies on ticks to hold the player still and to time out.
 */
public class ActivationScreen extends Screen {
	private static final int FIELD_WIDTH = 220;
	private static final int OK_COLOR = 0xFF7BD87B;
	private static final int ERROR_COLOR = 0xFFFF6B6B;

	private final String mapTitle;

	/** Long enough to read "activated" before the world comes back. */
	private static final int CLOSE_DELAY_TICKS = 40;

	private TextFieldWidget codeField;
	private ButtonWidget submitButton;
	private Text message = Text.empty();
	private int messageColor = ERROR_COLOR;
	private int closeCountdown = -1;

	public ActivationScreen(String mapTitle) {
		super(Text.translatable("screen.map-license.title"));
		this.mapTitle = mapTitle;
	}

	@Override
	protected void init() {
		int centerX = this.width / 2;
		int top = this.height / 2 - 10;

		// Rebuilt on resize, so carry the half-typed code across instead of
		// making the player start over.
		String previous = this.codeField != null ? this.codeField.getText() : "";

		this.codeField = new TextFieldWidget(this.textRenderer, centerX - FIELD_WIDTH / 2, top, FIELD_WIDTH, 20,
				Text.translatable("screen.map-license.code"));
		this.codeField.setMaxLength(32);
		this.codeField.setPlaceholder(Text.literal("XXXX-XXXX-XXXX-XXXX"));
		this.codeField.setText(previous);
		this.addDrawableChild(this.codeField);

		this.submitButton = ButtonWidget.builder(Text.translatable("screen.map-license.activate"), button -> submit())
				.dimensions(centerX - 100, top + 28, 200, 20)
				.build();
		this.addDrawableChild(this.submitButton);

		this.setInitialFocus(this.codeField);
	}

	private void submit() {
		String code = this.codeField.getText().trim();
		if (code.isEmpty()) {
			return;
		}

		this.submitButton.active = false;
		ClientPlayNetworking.send(new ActivateRequestC2S(code));
	}

	/** Called from the network thread's client-thread hop when the server answers. */
	public void onResult(boolean ok, String messageKey) {
		this.message = Text.translatable(messageKey);
		this.messageColor = ok ? OK_COLOR : ERROR_COLOR;
		this.submitButton.active = !ok;

		if (ok) {
			beginClose();
		}
	}

	/**
	 * Closes on a delay rather than the instant the server unlocks, so the player
	 * actually gets to read that it worked.
	 */
	public void beginClose() {
		if (this.closeCountdown < 0) {
			this.closeCountdown = CLOSE_DELAY_TICKS;
		}
	}

	@Override
	public void tick() {
		super.tick();

		if (this.closeCountdown > 0) {
			this.closeCountdown--;
		} else if (this.closeCountdown == 0) {
			this.closeCountdown = -1;
			this.close();
		}
	}

	@Override
	public boolean keyPressed(KeyInput input) {
		// Enter / numpad enter submits, matching every other code box people use.
		if ((input.key() == GLFW.GLFW_KEY_ENTER || input.key() == GLFW.GLFW_KEY_KP_ENTER)
				&& this.codeField.isFocused()) {
			submit();
			return true;
		}

		return super.keyPressed(input);
	}

	@Override
	public void render(DrawContext context, int mouseX, int mouseY, float deltaTicks) {
		super.render(context, mouseX, mouseY, deltaTicks);

		int centerX = this.width / 2;
		context.drawCenteredTextWithShadow(this.textRenderer, this.title, centerX, this.height / 2 - 60, 0xFFFFFFFF);
		context.drawCenteredTextWithShadow(this.textRenderer, Text.literal(this.mapTitle), centerX,
				this.height / 2 - 46, 0xFFA0A0A0);
		context.drawCenteredTextWithShadow(this.textRenderer, Text.translatable("screen.map-license.explain"),
				centerX, this.height / 2 - 30, 0xFFA0A0A0);
		context.drawCenteredTextWithShadow(this.textRenderer, this.message, centerX, this.height / 2 + 22,
				this.messageColor);
	}

	@Override
	public boolean shouldCloseOnEsc() {
		return false;
	}

	@Override
	public boolean shouldPause() {
		// Pausing would stop the integrated server, and with it the tick loop the
		// lock and its timeout run on.
		return false;
	}
}
