package net.jihoon.maplicense.client;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;
import net.jihoon.maplicense.net.ActivationResultS2C;
import net.jihoon.maplicense.net.GatePromptS2C;
import net.minecraft.client.MinecraftClient;

/** Client half of the mod: it only draws the prompt and relays what was typed. */
public class MapLicenseClient implements ClientModInitializer {
	@Override
	public void onInitializeClient() {
		ClientPlayNetworking.registerGlobalReceiver(GatePromptS2C.ID, (payload, context) ->
				context.client().execute(() -> onPrompt(context.client(), payload)));

		ClientPlayNetworking.registerGlobalReceiver(ActivationResultS2C.ID, (payload, context) ->
				context.client().execute(() -> onResult(context.client(), payload)));
	}

	private static void onPrompt(MinecraftClient client, GatePromptS2C payload) {
		if (payload.locked()) {
			if (!(client.currentScreen instanceof ActivationScreen)) {
				client.setScreen(new ActivationScreen(payload.title()));
			}
		} else if (client.currentScreen instanceof ActivationScreen screen) {
			// Hands off to the screen's own delay so the success message survives
			// the unlock rather than being wiped by it.
			screen.beginClose();
		}
	}

	private static void onResult(MinecraftClient client, ActivationResultS2C payload) {
		if (client.currentScreen instanceof ActivationScreen screen) {
			screen.onResult(payload.ok(), payload.messageKey());
		}
	}
}
