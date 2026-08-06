package net.jihoon.macestunslam;

import net.jihoon.macestunslam.mixin.MinecraftClientAccessor;
import net.minecraft.client.MinecraftClient;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.util.Hand;
import net.minecraft.util.hit.EntityHitResult;

/**
 * Held-left-click attacking that follows the sword's attack cooldown instead
 * of vanilla's fixed 10-tick repeat, which fires at roughly 80% charge.
 *
 * <p>Only the entity actually under the crosshair is attacked - the range
 * check narrows that further, it does not widen it into a radius sweep.
 */
public class AutoAttackController {

	/**
	 * Held in vanilla's attack counter while the mod owns the rhythm. Any value
	 * above zero blocks vanilla's own attack; this is re-applied every tick.
	 */
	private static final int VANILLA_SUPPRESS_TICKS = 4;

	public void tick(MinecraftClient client, PlayerEntity player) {
		ModConfig config = ModConfig.get();

		if (!config.autoAttack || client.interactionManager == null) {
			return;
		}
		// A GUI being open means the click belongs to that screen, not to combat.
		if (client.currentScreen != null || !client.options.attackKey.isPressed()) {
			return;
		}
		if (!WeaponSwapper.isSword(player.getMainHandStack())) {
			return;
		}

		if (!(client.crosshairTarget instanceof EntityHitResult entityHit)) {
			return;
		}

		// Measured eye-to-hit-point, the same geometry vanilla uses to decide
		// reach, so this is a sphere around the player's view origin.
		double distance = player.getEyePos().distanceTo(entityHit.getPos());
		if (distance > config.autoAttackMaxReach) {
			return;
		}

		// From here the mod owns the attack rhythm. Suppression is applied only
		// once a real target is in range, so held-click mining is untouched.
		((MinecraftClientAccessor) client).setAttackCooldown(VANILLA_SUPPRESS_TICKS);

		if (player.getAttackCooldownProgress(0.5f) < config.autoAttackMinCharge) {
			return;
		}

		client.interactionManager.attackEntity(player, entityHit.getEntity());
		player.swingHand(Hand.MAIN_HAND);
	}
}
