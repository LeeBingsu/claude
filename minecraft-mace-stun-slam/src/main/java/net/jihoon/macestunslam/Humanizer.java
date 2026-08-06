package net.jihoon.macestunslam;

import java.util.Random;

/**
 * Timing variance for the mod's three fixed signatures: the reaction gap after
 * the key goes down, the slot-change to attack gap, and the spacing between
 * inventory clicks.
 *
 * <p>Values are latched rather than re-rolled per tick. Re-rolling a threshold
 * that is compared every tick collapses to its maximum - the first roll that
 * clears fires - so each roll is held for the whole fall or swap it applies to.
 *
 * <p>Jitter only ever moves timings in the safe direction (earlier release,
 * longer settle), so variance costs a little damage but never the hit itself.
 */
public class Humanizer {

	private static final int UNSET = -1;

	private final Random random = new Random();

	private int latchedReleaseMargin = UNSET;

	/** Ticks between the key going down and the sequence starting. */
	public int reactionDelayTicks() {
		ModConfig config = ModConfig.get();
		return between(config.reactionDelayMinTicks, config.reactionDelayMaxTicks);
	}

	/**
	 * Ticks to wait after a hotbar change before attacking. Floored at 1: at
	 * zero the attack shares a tick with the slot change and the server may
	 * still resolve it as a sword hit.
	 */
	public int swapSettleTicks() {
		ModConfig config = ModConfig.get();
		return Math.max(1, between(config.swapSettleMinTicks, config.swapSettleMaxTicks));
	}

	/** Ticks between two clicks of a multi-click inventory swap. */
	public int inventoryClickSpacingTicks() {
		ModConfig config = ModConfig.get();
		return between(config.inventoryClickSpacingMinTicks, config.inventoryClickSpacingMaxTicks);
	}

	/**
	 * Release margin for the current fall, held until {@link #resetFall()}.
	 * Jittered upward only: firing earlier trades damage, firing later can miss.
	 */
	public int releaseMarginTicks() {
		if (latchedReleaseMargin == UNSET) {
			ModConfig config = ModConfig.get();
			latchedReleaseMargin = config.releaseMarginTicks + between(0, config.releaseMarginJitterTicks);
		}
		return latchedReleaseMargin;
	}

	public void resetFall() {
		latchedReleaseMargin = UNSET;
	}

	private int between(int min, int max) {
		int low = Math.max(0, min);
		int high = Math.max(low, max);
		return low == high ? low : low + random.nextInt(high - low + 1);
	}
}
