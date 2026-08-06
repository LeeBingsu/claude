package net.jihoon.macestunslam;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.util.InputUtil;
import org.lwjgl.glfw.GLFW;

public class MaceStunSlamClient implements ClientModInitializer {

	public static final String MOD_ID = "mace-stun-slam";

	private static final String CATEGORY = "key.categories.mace-stun-slam";

	/** Held down: runs the whole sequence (glide exit, mace swap, timed slam, sword swap). */
	public static KeyBinding slamKey;

	/** Tapped: swap the elytra for a chestplate, nothing else. */
	public static KeyBinding elytraSwapKey;

	/** Tapped: toggle between the mace and the sword. */
	public static KeyBinding weaponSwapKey;

	@Override
	public void onInitializeClient() {
		ModConfig.load();

		slamKey = register("key.mace-stun-slam.slam", GLFW.GLFW_KEY_V);
		// Unbound by default - these overlap with the slam key's job, so they
		// only matter to players who want the steps under separate fingers.
		elytraSwapKey = register("key.mace-stun-slam.elytra-swap", GLFW.GLFW_KEY_UNKNOWN);
		weaponSwapKey = register("key.mace-stun-slam.weapon-swap", GLFW.GLFW_KEY_UNKNOWN);

		StunSlamController controller = new StunSlamController();
		ClientTickEvents.END_CLIENT_TICK.register(controller::onClientTick);
	}

	private static KeyBinding register(String translationKey, int defaultKey) {
		return KeyBindingHelper.registerKeyBinding(
				new KeyBinding(translationKey, InputUtil.Type.KEYSYM, defaultKey, CATEGORY));
	}
}
