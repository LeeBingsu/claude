package net.jihoon.swordholdattack.mixin;

import net.minecraft.client.MinecraftClient;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.gen.Accessor;

/**
 * Exposes the field gating vanilla's held-left-click attack.
 *
 * <p>Vanilla re-attacks every 10 ticks while the attack key is held, which on a
 * sword is 0.80 charge - below the 0.848 needed for crits and sweep attacks.
 * Keeping this counter above zero suppresses that rhythm so the mod can attack
 * on the charge instead.
 */
@Mixin(MinecraftClient.class)
public interface MinecraftClientAccessor {

	@Accessor("attackCooldown")
	void setAttackCooldown(int attackCooldown);
}
