package net.jihoon.macestunslam;

import net.minecraft.client.MinecraftClient;
import net.minecraft.entity.Entity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.Items;
import net.minecraft.item.ItemStack;
import net.minecraft.text.Text;
import net.minecraft.util.Hand;
import net.minecraft.util.hit.EntityHitResult;
import net.minecraft.util.hit.HitResult;

/**
 * Runs every client tick. Never touches the camera - it times an already
 * in-flight fall so the mace smash attack lands the instant the vanilla
 * conditions for it are met (falling, minimum fall distance, mace in main
 * hand, a valid entity under the crosshair within range), and optionally
 * ends an elytra glide by swapping in a chestplate to start that fall.
 */
public class StunSlamController {

	private static final int NO_MACE_MESSAGE_INTERVAL_TICKS = 20;

	private final ElytraSwapper elytraSwapper = new ElytraSwapper();

	private boolean hasAutoJumpedThisHold = false;
	private int jumpKeyReleaseCountdown = 0;
	private int cooldownTicksRemaining = 0;
	private int noMaceMessageCooldown = 0;

	public void onClientTick(MinecraftClient client) {
		PlayerEntity player = client.player;

		if (player == null || client.world == null) {
			resetHoldState(client);
			return;
		}

		if (cooldownTicksRemaining > 0) {
			cooldownTicksRemaining--;
		}

		elytraSwapper.tick();
		releaseJumpKeyIfDue(client);

		boolean keyHeld = MaceStunSlamClient.slamKey.isPressed();
		if (!keyHeld) {
			resetHoldState(client);
			return;
		}

		if (!isHoldingMace(player)) {
			warnNoMace(player);
			return;
		}

		ModConfig config = ModConfig.get();

		if (elytraSwapper.isGliding(player)) {
			// A glide cannot produce a smash attack, so the only useful action
			// here is ending it; the fall it drops into is handled next tick.
			if (config.autoSwapElytra) {
				elytraSwapper.trySwapToChestplate(client, player);
			}
			return;
		}

		if (config.autoJump && player.isOnGround() && !hasAutoJumpedThisHold) {
			client.options.jumpKey.setPressed(true);
			jumpKeyReleaseCountdown = 2;
			hasAutoJumpedThisHold = true;
			return;
		}

		if (cooldownTicksRemaining > 0) {
			return;
		}

		if (isValidSmashWindow(client, player, config)) {
			performAttack(client);
			cooldownTicksRemaining = config.cooldownTicks;
			hasAutoJumpedThisHold = false;
		}
	}

	private boolean isValidSmashWindow(MinecraftClient client, PlayerEntity player, ModConfig config) {
		boolean falling = !player.isOnGround() && player.getVelocity().y < -0.05;
		if (!falling || player.fallDistance < config.minFallDistance) {
			return false;
		}

		HitResult target = client.crosshairTarget;
		if (!(target instanceof EntityHitResult entityHit)) {
			return false;
		}

		Entity entity = entityHit.getEntity();
		double rangeSq = config.attackRangeBlocks * config.attackRangeBlocks;
		return player.squaredDistanceTo(entity) <= rangeSq;
	}

	private void performAttack(MinecraftClient client) {
		if (client.crosshairTarget instanceof EntityHitResult entityHit && client.interactionManager != null) {
			client.interactionManager.attackEntity(client.player, entityHit.getEntity());
			client.player.swingHand(Hand.MAIN_HAND);
		}
	}

	private boolean isHoldingMace(PlayerEntity player) {
		ItemStack mainHand = player.getMainHandStack();
		return mainHand.isOf(Items.MACE);
	}

	private void warnNoMace(PlayerEntity player) {
		if (noMaceMessageCooldown <= 0) {
			player.sendMessage(Text.translatable("message.mace-stun-slam.no-mace"), true);
			noMaceMessageCooldown = NO_MACE_MESSAGE_INTERVAL_TICKS;
		} else {
			noMaceMessageCooldown--;
		}
	}

	private void releaseJumpKeyIfDue(MinecraftClient client) {
		if (jumpKeyReleaseCountdown > 0) {
			jumpKeyReleaseCountdown--;
			if (jumpKeyReleaseCountdown == 0) {
				client.options.jumpKey.setPressed(false);
			}
		}
	}

	private void resetHoldState(MinecraftClient client) {
		hasAutoJumpedThisHold = false;
		if (jumpKeyReleaseCountdown > 0) {
			jumpKeyReleaseCountdown = 0;
			client.options.jumpKey.setPressed(false);
		}
	}
}
