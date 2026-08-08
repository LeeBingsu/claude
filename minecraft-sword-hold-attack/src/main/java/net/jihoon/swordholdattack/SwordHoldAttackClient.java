package net.jihoon.swordholdattack;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;
import org.lwjgl.glfw.GLFW;

public class SwordHoldAttackClient implements ClientModInitializer {

	public static final String MOD_ID = "sword-hold-attack";

	// 1.21.9+ takes a Category object rather than the plain translation key
	// string older versions accepted, and Category.create(String) is private.
	private static final KeyBinding.Category CATEGORY =
			KeyBinding.Category.create(Identifier.of(MOD_ID, "main"));

	/** Tapped: turn the whole feature on or off without leaving the game. */
	public static KeyBinding toggleKey;

	@Override
	public void onInitializeClient() {
		ModConfig.load();

		// H rather than V, so the two mods' defaults do not collide when both
		// are installed.
		toggleKey = KeyBindingHelper.registerKeyBinding(
				new KeyBinding("key.sword-hold-attack.toggle", GLFW.GLFW_KEY_H, CATEGORY));

		AutoAttackController controller = new AutoAttackController();
		ClientTickEvents.END_CLIENT_TICK.register(client -> {
			handleToggleKey(client);
			controller.tick(client);
		});
	}

	private static void handleToggleKey(MinecraftClient client) {
		while (toggleKey.wasPressed()) {
			ModConfig config = ModConfig.get();
			config.enabled = !config.enabled;
			// Persisted immediately, so the state survives a restart rather than
			// silently reverting to whatever the file last held.
			ModConfig.save();

			if (client.player != null) {
				client.player.sendMessage(Text.translatable(config.enabled
						? "message.sword-hold-attack.enabled"
						: "message.sword-hold-attack.disabled"), true);
			}
		}
	}
}
