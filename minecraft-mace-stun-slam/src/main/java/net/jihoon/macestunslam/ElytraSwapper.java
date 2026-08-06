package net.jihoon.macestunslam;

import net.minecraft.client.MinecraftClient;
import net.minecraft.component.DataComponentTypes;
import net.minecraft.component.type.EquippableComponent;
import net.minecraft.entity.EquipmentSlot;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.screen.slot.SlotActionType;

import java.util.ArrayDeque;
import java.util.Deque;

/**
 * Swaps a gliding player's elytra out for a chestplate through the normal
 * player screen handler, which is what the vanilla inventory screen does -
 * losing the elytra ends the glide, so the fall the slam logic waits for
 * starts on the same tick.
 *
 * <p>The three-click path is queued across ticks rather than sent at once. A
 * human cannot click three slots inside one tick, and the burst is also the
 * most desync-prone thing the mod does.
 */
public class ElytraSwapper {

	/** Chest armor slot index inside PlayerScreenHandler (5=head, 6=chest, 7=legs, 8=feet). */
	private static final int CHEST_ARMOR_SCREEN_SLOT = 6;

	private static final int HOTBAR_SIZE = 9;
	private static final int INVENTORY_MAIN_SIZE = 36;

	/** Screen-handler index of the first main-inventory (non-hotbar) slot. */
	private static final int SCREEN_MAIN_START = 9;

	private record PendingClick(int screenSlot, int button, SlotActionType action) {}

	private final Humanizer humanizer;
	private final Deque<PendingClick> pendingClicks = new ArrayDeque<>();

	private int cooldownTicksRemaining = 0;
	private int nextClickDelayTicks = 0;

	public ElytraSwapper(Humanizer humanizer) {
		this.humanizer = humanizer;
	}

	public void tick(MinecraftClient client, PlayerEntity player) {
		if (cooldownTicksRemaining > 0) {
			cooldownTicksRemaining--;
		}
		drainPendingClicks(client, player);
	}

	public boolean isGliding(PlayerEntity player) {
		return player.isGliding();
	}

	/**
	 * @return true if a swap was queued this tick.
	 */
	public boolean trySwapToChestplate(MinecraftClient client, PlayerEntity player) {
		if (cooldownTicksRemaining > 0 || !pendingClicks.isEmpty() || client.interactionManager == null) {
			return false;
		}

		if (!player.getEquippedStack(EquipmentSlot.CHEST).isOf(Items.ELYTRA)) {
			return false;
		}

		int inventorySlot = findChestplateSlot(player);
		if (inventorySlot < 0) {
			return false;
		}

		if (inventorySlot < HOTBAR_SIZE) {
			// Single hotbar swap - the same interaction as pressing a number key
			// while hovering the chest slot. One click, so nothing to spread.
			pendingClicks.add(new PendingClick(CHEST_ARMOR_SCREEN_SLOT, inventorySlot, SlotActionType.SWAP));
		} else {
			// Chestplate lives outside the hotbar, so mimic the three-click
			// pickup/place/put-back the inventory screen would need.
			int sourceScreenSlot = SCREEN_MAIN_START + (inventorySlot - HOTBAR_SIZE);
			pendingClicks.add(new PendingClick(sourceScreenSlot, 0, SlotActionType.PICKUP));
			pendingClicks.add(new PendingClick(CHEST_ARMOR_SCREEN_SLOT, 0, SlotActionType.PICKUP));
			pendingClicks.add(new PendingClick(sourceScreenSlot, 0, SlotActionType.PICKUP));
		}

		nextClickDelayTicks = 0;
		cooldownTicksRemaining = ModConfig.get().swapCooldownTicks;
		return true;
	}

	private void drainPendingClicks(MinecraftClient client, PlayerEntity player) {
		if (pendingClicks.isEmpty() || client.interactionManager == null) {
			return;
		}
		if (nextClickDelayTicks > 0) {
			nextClickDelayTicks--;
			return;
		}

		PendingClick click = pendingClicks.poll();
		client.interactionManager.clickSlot(
				player.playerScreenHandler.syncId, click.screenSlot(), click.button(), click.action(), player);

		nextClickDelayTicks = pendingClicks.isEmpty()
				? 0
				: (ModConfig.get().humanize ? humanizer.inventoryClickSpacingTicks() : 0);
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
