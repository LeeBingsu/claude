package net.jihoon.swordholdattack;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;

public class SwordHoldAttackClient implements ClientModInitializer {

	public static final String MOD_ID = "sword-hold-attack";

	@Override
	public void onInitializeClient() {
		ModConfig.load();

		AutoAttackController controller = new AutoAttackController();
		ClientTickEvents.END_CLIENT_TICK.register(controller::tick);
	}
}
