package net.jihoon.macestunslam;

import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.registry.tag.ItemTags;

import java.util.function.Predicate;

/**
 * Hotbar side of the mace/sword attribute swap.
 *
 * <p>Attack cooldown lives on the player ({@code lastAttackedTicks}), not on
 * the held item, so switching hotbar slots carries the charge over while the
 * attack-speed attribute used to interpret it changes with the weapon. That
 * makes two switches worth automating: into the mace for the slam itself, and
 * straight back to the sword afterwards, since the sword re-charges in ~12.5
 * ticks where the mace would hold the player at ~33.
 */
public class WeaponSwapper {

	private static final int HOTBAR_SIZE = 9;

	private int pendingSwordSwapTicks = 0;

	/** Runs every tick so a scheduled swap back to the sword fires even after the key is released. */
	public void tick(PlayerEntity player) {
		if (pendingSwordSwapTicks > 0) {
			pendingSwordSwapTicks--;
			if (pendingSwordSwapTicks == 0) {
				selectSword(player);
			}
		}
	}

	public boolean isMaceSelected(PlayerEntity player) {
		return player.getMainHandStack().isOf(Items.MACE);
	}

	/**
	 * @return false when no mace is reachable from the hotbar, leaving the
	 *         selection untouched.
	 */
	public boolean selectMace(PlayerEntity player) {
		int slot = resolveSlot(player, ModConfig.get().maceHotbarSlot, this::isMace);
		return select(player, slot);
	}

	public boolean selectSword(PlayerEntity player) {
		int slot = resolveSlot(player, ModConfig.get().swordHotbarSlot, this::isSword);
		return select(player, slot);
	}

	public void scheduleSwordSwap(int delayTicks) {
		pendingSwordSwapTicks = Math.max(1, delayTicks);
	}

	/**
	 * How charged the current weapon's attack is, 0.0 to 1.0. Reading it after
	 * the mace is selected is what makes the swap worth timing - the same
	 * elapsed ticks read as a full sword hit but a partial mace hit.
	 */
	public float attackCharge(PlayerEntity player) {
		return player.getAttackCooldownProgress(0.5f);
	}

	private boolean select(PlayerEntity player, int slot) {
		if (slot < 0) {
			return false;
		}
		if (player.getInventory().getSelectedSlot() != slot) {
			// ClientPlayerEntity notices the change on its own tick and sends
			// UpdateSelectedSlotC2SPacket, so no manual packet is needed.
			player.getInventory().setSelectedSlot(slot);
		}
		return true;
	}

	/**
	 * @param configuredSlot an explicit hotbar index from the config, or -1 to
	 *                       scan the hotbar for a matching item.
	 */
	private int resolveSlot(PlayerEntity player, int configuredSlot, Predicate<ItemStack> match) {
		if (configuredSlot >= 0 && configuredSlot < HOTBAR_SIZE) {
			return configuredSlot;
		}
		for (int slot = 0; slot < HOTBAR_SIZE; slot++) {
			if (match.test(player.getInventory().getStack(slot))) {
				return slot;
			}
		}
		return -1;
	}

	private boolean isMace(ItemStack stack) {
		return stack.isOf(Items.MACE);
	}

	private boolean isSword(ItemStack stack) {
		return stack.isIn(ItemTags.SWORDS);
	}
}
