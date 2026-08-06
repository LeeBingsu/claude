package net.jihoon.macestunslam;

import net.minecraft.client.MinecraftClient;
import net.minecraft.component.DataComponentTypes;
import net.minecraft.component.type.EquippableComponent;
import net.minecraft.entity.EquipmentSlot;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.screen.slot.SlotActionType;

/**
 * Swaps a gliding player's elytra out for a chestplate through the normal
 * player screen handler, which is what the vanilla inventory screen does -
 * losing the elytra ends the glide, so the fall the slam logic waits for
 * starts on the same tick.
 */
public class ElytraSwapper {

	/** Chest armor slot index inside PlayerScreenHandler (5=head, 6=chest, 7=legs, 8=feet). */
	private static final int CHEST_ARMOR_SCREEN_SLOT = 6;

	private static final int HOTBAR_SIZE = 9;
	private static final int INVENTORY_MAIN_SIZE = 36;

	/** Screen-handler index of the first main-inventory (non-hotbar) slot. */
	private static final int SCREEN_MAIN_START = 9;

	private int cooldownTicksRemaining = 0;

	public void tick() {
		if (cooldownTicksRemaining > 0) {
			cooldownTicksRemaining--;
		}
	}

	public boolean isGliding(PlayerEntity player) {
		return player.isGliding();
	}

	/**
	 * @return true if a swap was issued this tick.
	 */
	public boolean trySwapToChestplate(MinecraftClient client, PlayerEntity player) {
		if (cooldownTicksRemaining > 0 || client.interactionManager == null) {
			return false;
		}

		if (!player.getEquippedStack(EquipmentSlot.CHEST).isOf(Items.ELYTRA)) {
			return false;
		}

		int inventorySlot = findChestplateSlot(player);
		if (inventorySlot < 0) {
			return false;
		}

		int syncId = player.playerScreenHandler.syncId;

		if (inventorySlot < HOTBAR_SIZE) {
			// Single hotbar swap - the same interaction as pressing a number key
			// while hovering the chest slot.
			client.interactionManager.clickSlot(
					syncId, CHEST_ARMOR_SCREEN_SLOT, inventorySlot, SlotActionType.SWAP, player);
		} else {
			// Chestplate lives outside the hotbar, so mimic the three-click
			// pickup/place/put-back the inventory screen would need.
			int sourceScreenSlot = SCREEN_MAIN_START + (inventorySlot - HOTBAR_SIZE);
			client.interactionManager.clickSlot(syncId, sourceScreenSlot, 0, SlotActionType.PICKUP, player);
			client.interactionManager.clickSlot(syncId, CHEST_ARMOR_SCREEN_SLOT, 0, SlotActionType.PICKUP, player);
			client.interactionManager.clickSlot(syncId, sourceScreenSlot, 0, SlotActionType.PICKUP, player);
		}

		cooldownTicksRemaining = ModConfig.get().swapCooldownTicks;
		return true;
	}

	/**
	 * @return a PlayerInventory index (0-8 hotbar, 9-35 main) holding a
	 *         chestplate, or -1 when the player is not carrying one.
	 */
	private int findChestplateSlot(PlayerEntity player) {
		for (int slot = 0; slot < INVENTORY_MAIN_SIZE; slot++) {
			if (isChestplate(player.getInventory().getStack(slot))) {
				return slot;
			}
		}
		return -1;
	}

	private boolean isChestplate(ItemStack stack) {
		if (stack.isEmpty() || stack.isOf(Items.ELYTRA)) {
			return false;
		}
		EquippableComponent equippable = stack.get(DataComponentTypes.EQUIPPABLE);
		return equippable != null && equippable.slot() == EquipmentSlot.CHEST;
	}
}
