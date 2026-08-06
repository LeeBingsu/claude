package net.jihoon.macestunslam.mixin;

import net.minecraft.client.MinecraftClient;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.gen.Accessor;

/**
 * Exposes the field gating vanilla's held-left-click attack.
 *
 * <p>Vanilla re-attacks every 10 ticks while the attack key is held, but a
 * sword needs 12.5 ticks to fully charge - so held clicking always swings at
 * roughly 80%. Keeping this counter above zero suppresses that fixed rhythm so
 * the mod can attack on the charge instead.
 */
@Mixin(MinecraftClient.class)
public interface MinecraftClientAccessor {

	@Accessor("attackCooldown")
	void setAttackCooldown(int attackCooldown);
}
