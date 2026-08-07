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

<<<<<<< HEAD
	private static final float UNSET = -1.0f;

	private static final float TICKS_PER_SECOND = 20.0f;
=======
	private static final int UNSET = -1;
>>>>>>> 9df52b028dd897d3df4a544ab059836699cafba8

	private final Random random = new Random();

	/** Ticks elapsed since this controller last swung. */
	private int ticksSinceAttack = 0;

	/**
<<<<<<< HEAD
	 * Interval this swing is waiting for, in ticks, rolled once and held until
	 * it happens. Re-rolling every tick would not randomise anything: the
	 * elapsed count climbs past the whole range, so the first tick whose roll it
	 * clears is the one that fires, and every swing would land at the minimum.
	 *
	 * <p>Kept fractional on purpose. The swing still lands on a whole tick, but
	 * where the fraction falls decides which whole tick that is, and so shapes
	 * the distribution of intervals an observer sees.
	 */
	private float targetInterval = UNSET;
=======
	 * Interval this swing is waiting for, rolled once and held until it happens.
	 * Re-rolling every tick would not randomise anything: the elapsed count
	 * climbs past the whole range, so the first tick whose roll it clears is the
	 * one that fires, and every swing would land at the range minimum.
	 */
	private int targetInterval = UNSET;
>>>>>>> 9df52b028dd897d3df4a544ab059836699cafba8

	public void tick(MinecraftClient client) {
		PlayerEntity player = client.player;
		ModConfig config = ModConfig.get();

		// Counted before any guard, so time spent without a target still
		// accumulates and a swing is ready the moment one appears.
		if (ticksSinceAttack < Integer.MAX_VALUE) {
			ticksSinceAttack++;
		}

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

		if (targetInterval == UNSET) {
			targetInterval = rollInterval(config);
		}
		if (ticksSinceAttack < targetInterval) {
			return;
		}
		// Independent of the interval: something else may have reset the
		// cooldown, and a swing under this charge loses crits and sweeps.
		if (player.getAttackCooldownProgress(0.5f) < config.minCharge) {
			return;
		}

		client.interactionManager.attackEntity(player, entityHit.getEntity());
		player.swingHand(Hand.MAIN_HAND);

		ticksSinceAttack = 0;
		// The next swing gets its own interval.
		targetInterval = UNSET;
	}

<<<<<<< HEAD
	private float rollInterval(ModConfig config) {
		// Tolerates the bounds being configured the wrong way round.
		float low = (float) Math.min(config.minIntervalSeconds, config.maxIntervalSeconds) * TICKS_PER_SECOND;
		float high = (float) Math.max(config.minIntervalSeconds, config.maxIntervalSeconds) * TICKS_PER_SECOND;
		low = Math.max(1.0f, low);
		high = Math.max(low, high);
		return low >= high ? low : low + random.nextFloat() * (high - low);
=======
	private int rollInterval(ModConfig config) {
		// Tolerates the bounds being configured the wrong way round.
		int low = Math.max(1, Math.min(config.minIntervalTicks, config.maxIntervalTicks));
		int high = Math.max(config.minIntervalTicks, config.maxIntervalTicks);
		return low >= high ? low : low + random.nextInt(high - low + 1);
>>>>>>> 9df52b028dd897d3df4a544ab059836699cafba8
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
