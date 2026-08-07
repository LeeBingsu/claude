package net.jihoon.swordholdattack;

import net.jihoon.swordholdattack.mixin.MinecraftClientAccessor;
import net.minecraft.client.MinecraftClient;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.util.Hand;
import net.minecraft.util.hit.EntityHitResult;

import java.util.Random;

/**
 * Held-left-click attacking that follows the sword's attack cooldown rather
 * than vanilla's fixed 10-tick repeat.
 *
 * <p>Only the entity actually under the crosshair is attacked. The range check
 * narrows that further; it never widens it into a radius sweep, and the camera
 * is never moved.
 */
public class AutoAttackController {

	/**
	 * Held in vanilla's attack counter while the mod owns the rhythm. Any value
	 * above zero blocks vanilla's own attack; re-applied every tick.
	 */
	private static final int VANILLA_SUPPRESS_TICKS = 4;

	private static final float UNSET = -1.0f;

	private final Random random = new Random();

	/**
	 * Charge required for the next swing, rolled once and held until that swing
	 * happens. Re-rolling every tick would not randomise anything: charge climbs
	 * past the whole range, so the first tick whose roll it clears is the one
	 * that fires, and every swing would land at the bottom of the range.
	 */
	private float requiredCharge = UNSET;

	public void tick(MinecraftClient client) {
		PlayerEntity player = client.player;
		ModConfig config = ModConfig.get();

		if (!config.enabled || player == null || client.world == null || client.interactionManager == null) {
			return;
		}
		// A GUI being open means the click belongs to that screen, not to combat.
		if (client.currentScreen != null || !client.options.attackKey.isPressed()) {
			return;
		}
		if (!isSword(player.getMainHandStack())) {
			return;
		}

		if (!(client.crosshairTarget instanceof EntityHitResult entityHit)) {
			return;
		}

		// Measured eye-to-hit-point, the same geometry vanilla uses to decide
		// reach, so this is a sphere around the player's view origin.
		double distance = player.getEyePos().distanceTo(entityHit.getPos());
		if (distance > config.maxReach) {
			return;
		}

		// From here the mod owns the attack rhythm. Suppression is applied only
		// once a real target is in range, so held-click mining is untouched.
		((MinecraftClientAccessor) client).setAttackCooldown(VANILLA_SUPPRESS_TICKS);

		if (requiredCharge == UNSET) {
			requiredCharge = rollRequiredCharge(config);
		}
		if (player.getAttackCooldownProgress(0.5f) < requiredCharge) {
			return;
		}

		client.interactionManager.attackEntity(player, entityHit.getEntity());
		player.swingHand(Hand.MAIN_HAND);

		// The next swing gets its own value.
		requiredCharge = UNSET;
	}

	private float rollRequiredCharge(ModConfig config) {
		// Tolerates the bounds being configured the wrong way round.
		float low = Math.max(0.0f, Math.min(config.minCharge, config.maxCharge));
		float high = Math.min(1.0f, Math.max(config.minCharge, config.maxCharge));
		return low >= high ? low : low + random.nextFloat() * (high - low);
	}

	/**
	 * Explicit item list rather than the {@code #minecraft:swords} tag: the
	 * yarn 1.21.11 ItemTags mapping carries no named tag constants, so
	 * {@code ItemTags.SWORDS} does not resolve. Swapping this body for
	 * {@code stack.isIn(ItemTags.SWORDS)} would also cover modded swords if a
	 * future mapping exposes it.
	 */
	private static boolean isSword(ItemStack stack) {
		return stack.isOf(Items.WOODEN_SWORD)
				|| stack.isOf(Items.STONE_SWORD)
				|| stack.isOf(Items.IRON_SWORD)
				|| stack.isOf(Items.GOLDEN_SWORD)
				|| stack.isOf(Items.DIAMOND_SWORD)
				|| stack.isOf(Items.NETHERITE_SWORD);
	}
}
