package net.jihoon.maplicense;

import net.fabricmc.fabric.api.entity.event.v1.ServerLivingEntityEvents;
import net.fabricmc.fabric.api.event.player.AttackBlockCallback;
import net.fabricmc.fabric.api.event.player.AttackEntityCallback;
import net.fabricmc.fabric.api.event.player.PlayerBlockBreakEvents;
import net.fabricmc.fabric.api.event.player.UseBlockCallback;
import net.fabricmc.fabric.api.event.player.UseEntityCallback;
import net.fabricmc.fabric.api.event.player.UseItemCallback;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.util.ActionResult;

/**
 * Makes a locked player inert: they can look around and type, and that is all.
 *
 * <p>Damage is blocked too - a player frozen in place next to a mob would
 * otherwise die while reading the activation prompt.
 */
public final class PlayerRestrictions {
	private PlayerRestrictions() {
	}

	public static void register() {
		AttackBlockCallback.EVENT.register((player, world, hand, pos, direction) ->
				blocked(player) ? ActionResult.FAIL : ActionResult.PASS);

		AttackEntityCallback.EVENT.register((player, world, hand, entity, hitResult) ->
				blocked(player) ? ActionResult.FAIL : ActionResult.PASS);

		UseBlockCallback.EVENT.register((player, world, hand, hitResult) ->
				blocked(player) ? ActionResult.FAIL : ActionResult.PASS);

		UseEntityCallback.EVENT.register((player, world, hand, entity, hitResult) ->
				blocked(player) ? ActionResult.FAIL : ActionResult.PASS);

		UseItemCallback.EVENT.register((player, world, hand) ->
				blocked(player) ? ActionResult.FAIL : ActionResult.PASS);

		PlayerBlockBreakEvents.BEFORE.register((world, player, pos, state, blockEntity) -> !blocked(player));

		ServerLivingEntityEvents.ALLOW_DAMAGE.register((entity, source, amount) -> !blocked(entity));
	}

	private static boolean blocked(PlayerEntity player) {
		return player instanceof ServerPlayerEntity serverPlayer && MapLicense.locks().isLocked(serverPlayer);
	}

	private static boolean blocked(LivingEntity entity) {
		return entity instanceof ServerPlayerEntity serverPlayer && MapLicense.locks().isLocked(serverPlayer);
	}
}
