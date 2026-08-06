package net.jihoon.macestunslam;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.util.InputUtil;
import org.lwjgl.glfw.GLFW;

public class MaceStunSlamClient implements ClientModInitializer {

	public static final String MOD_ID = "mace-stun-slam";

	public static KeyBinding slamKey;

	@Override
	public void onInitializeClient() {
		ModConfig.load();

		slamKey = KeyBindingHelper.registerKeyBinding(new KeyBinding(
				"key.mace-stun-slam.slam",
				InputUtil.Type.KEYSYM,
				GLFW.GLFW_KEY_V,
				"key.categories.mace-stun-slam"
		));

		StunSlamController controller = new StunSlamController();
		ClientTickEvents.END_CLIENT_TICK.register(controller::onClientTick);
	}
}
