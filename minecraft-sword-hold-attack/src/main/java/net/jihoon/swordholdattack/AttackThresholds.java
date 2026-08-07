package net.jihoon.swordholdattack;

/**
 * Charge thresholds that matter mechanically, kept in one place because the
 * important one is not obvious from the damage formula alone.
 */
public final class AttackThresholds {

	/**
	 * Attack cooldown progress required for critical hits, sweep attacks and
	 * sprint-knockback attacks to activate at all.
	 *
	 * <p>This is a cliff, not a curve: at 0.84 none of the three happen, at
	 * 0.85 all three are available. Vanilla held-clicking sits at 0.80 and so
	 * never sweeps or crits, which is why holding the button is weak in melee
	 * beyond the raw damage multiplier.
	 *
	 * @see <a href="https://minecraft.wiki/w/Melee_attack">Melee attack</a>
	 */
	public static final float CRIT_AND_SWEEP = 0.848f;

	/** Ticks for a full charge = 20 / attack speed. A sword's speed is 1.6. */
	public static final float SWORD_FULL_CHARGE_TICKS = 12.5f;

	private AttackThresholds() {
	}
}
