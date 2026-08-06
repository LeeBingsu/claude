package net.jihoon.macestunslam;

import net.minecraft.client.MinecraftClient;
import net.minecraft.entity.Entity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.Hand;
import net.minecraft.util.hit.EntityHitResult;

/**
 * Runs every client tick. Never touches the camera - it times an already
 * in-flight fall so the mace smash attack lands the instant the vanilla
 * conditions for it are met (falling, minimum fall distance, mace selected
 * and charged, a valid entity under the crosshair within range). It can also
 * end an elytra glide by swapping in a chestplate to start that fall, and
 * handle the mace/sword swap around the hit itself.
 */
public class StunSlamController {

	private static final int NO_MACE_MESSAGE_INTERVAL_TICKS = 20;

	private final ElytraSwapper elytraSwapper = new ElytraSwapper();
	private final WeaponSwapper weaponSwapper = new WeaponSwapper();
	private final FallPredictor fallPredictor = new FallPredictor();

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
		// Ticked before the key check so a scheduled swap back to the sword
		// still lands after the player lets go of the key.
		weaponSwapper.tick(player);
		releaseJumpKeyIfDue(client);
		handleStandaloneKeys(client, player);

		boolean keyHeld = MaceStunSlamClient.slamKey.isPressed();
		if (!keyHeld) {
			resetHoldState(client);
			return;
		}

		ModConfig config = ModConfig.get();

		// Checked before the weapon, since ending the glide is what creates the
		// fall everything below depends on.
		if (elytraSwapper.isGliding(player)) {
			if (config.autoSwapElytra) {
				elytraSwapper.trySwapToChestplate(client, player);
			}
			return;
		}

		if (!weaponSwapper.isMaceSelected(player)) {
			if (!config.attributeSwap || !weaponSwapper.selectMace(player)) {
				warnNoMace(player);
			}
			// Either way, wait a tick: the slot change has to reach the server
			// before the attack, or it lands as a sword hit instead of a slam.
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

			if (config.attributeSwap) {
				weaponSwapper.scheduleSwordSwap(config.swapBackToSwordDelayTicks);
			}
		}
	}

	private boolean isValidSmashWindow(MinecraftClient client, PlayerEntity player, ModConfig config) {
		boolean falling = !player.isOnGround() && player.getVelocity().y < -0.05;
		if (!falling || player.fallDistance < config.minFallDistance) {
			return false;
		}

		if (!hasTargetInRange(client, player, config)) {
			return false;
		}

		// Read with the mace already selected, so this is the mace's ~33-tick
		// charge rather than the sword's ~12.5-tick one.
		float charge = weaponSwapper.attackCharge(player);

		if (!config.maxDamageMode) {
			return charge >= config.minAttackCooldownProgress;
		}

		// The smash bonus grows with fall distance, so every extra tick in the
		// air is more damage - hold until landing is close enough that another
		// tick risks losing the hit entirely.
		int ticksToImpact = fallPredictor.ticksToImpact(client, player);
		boolean bottomless = ticksToImpact == FallPredictor.NO_IMPACT;
		boolean lastChance = ticksToImpact <= config.releaseMarginTicks;

		if (charge >= config.minAttackCooldownProgress) {
			// Nothing left to wait for but altitude; over a void there is no
			// landing to wait for at all, so take the hit now.
			return lastChance || bottomless;
		}

		// Still charging. Firing undercharged is bad, but landing with no slam
		// at all is worse - so salvage the hit on the way out.
		return lastChance && charge >= config.minSalvageCharge;
	}

	private boolean hasTargetInRange(MinecraftClient client, PlayerEntity player, ModConfig config) {
		if (!(client.crosshairTarget instanceof EntityHitResult entityHit)) {
			return false;
		}
		Entity entity = entityHit.getEntity();
		double rangeSq = config.attackRangeBlocks * config.attackRangeBlocks;
		return player.squaredDistanceTo(entity) <= rangeSq;
	}

	private void handleStandaloneKeys(MinecraftClient client, PlayerEntity player) {
		while (MaceStunSlamClient.elytraSwapKey.wasPressed()) {
			elytraSwapper.trySwapToChestplate(client, player);
		}
		while (MaceStunSlamClient.weaponSwapKey.wasPressed()) {
			weaponSwapper.toggleWeapon(player);
		}
	}

	private void performAttack(MinecraftClient client) {
		if (client.crosshairTarget instanceof EntityHitResult entityHit && client.interactionManager != null) {
			client.interactionManager.attackEntity(client.player, entityHit.getEntity());
			client.player.swingHand(Hand.MAIN_HAND);
		}
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
