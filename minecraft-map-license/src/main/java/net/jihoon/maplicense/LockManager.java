package net.jihoon.maplicense;

import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;
import net.jihoon.maplicense.net.GatePromptS2C;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.math.Vec3d;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;

/**
 * Holds unlicensed players in place instead of kicking them, so they still have
 * a window in which to type their code.
 *
 * <p>Pinning to the join position each tick beats status effects here: nothing
 * is written into the player's saved data, so releasing the lock leaves no
 * trace to clean up if the activation succeeds.
 */
public final class LockManager {
	private static final int PROMPT_INTERVAL_TICKS = 60;
	private static final int ATTEMPT_COOLDOWN_TICKS = 20;
	private static final int MAX_ATTEMPTS = 10;

	private final Map<UUID, Lock> locks = new HashMap<>();

	private static final class Lock {
		private final Vec3d pos;
		private final float yaw;
		private final float pitch;
		private int ticks;
		private int attempts;
		private int lastAttemptTick = Integer.MIN_VALUE;

		private Lock(ServerPlayerEntity player) {
			this.pos = player.getEntityPos();
			this.yaw = player.getYaw();
			this.pitch = player.getPitch();
		}
	}

	public void lock(ServerPlayerEntity player) {
		locks.put(player.getUuid(), new Lock(player));
	}

	public void release(ServerPlayerEntity player) {
		locks.remove(player.getUuid());
	}

	public boolean isLocked(ServerPlayerEntity player) {
		return locks.containsKey(player.getUuid());
	}

	/** Rate limits code submissions so the digest list cannot be hammered. */
	public boolean consumeAttempt(ServerPlayerEntity player) {
		Lock lock = locks.get(player.getUuid());
		if (lock == null) {
			return true;
		}

		if (lock.attempts >= MAX_ATTEMPTS || lock.ticks - lock.lastAttemptTick < ATTEMPT_COOLDOWN_TICKS) {
			return false;
		}

		lock.attempts++;
		lock.lastAttemptTick = lock.ticks;
		return true;
	}

	public void tick(MinecraftServer server) {
		if (locks.isEmpty()) {
			return;
		}

		int timeoutTicks = MapLicense.gate().lockTimeoutSeconds() * 20;

		for (Iterator<Map.Entry<UUID, Lock>> it = locks.entrySet().iterator(); it.hasNext();) {
			Map.Entry<UUID, Lock> entry = it.next();
			ServerPlayerEntity player = server.getPlayerManager().getPlayer(entry.getKey());

			if (player == null) {
				it.remove();
				continue;
			}

			Lock lock = entry.getValue();
			lock.ticks++;

			if (lock.ticks > timeoutTicks) {
				it.remove();
				player.networkHandler.disconnect(Messages.of("message.map-license.timeout"));
				continue;
			}

			player.setVelocity(Vec3d.ZERO);
			player.velocityDirty = true;
			player.onLanding();
			player.networkHandler.requestTeleport(lock.pos.x, lock.pos.y, lock.pos.z, lock.yaw, lock.pitch);

			// Resent on a timer because the client may still be on the terrain
			// loading screen when the first prompt lands, which would eat it.
			if (lock.ticks % PROMPT_INTERVAL_TICKS == 1) {
				MapLicense.sendPrompt(player);
			}
		}
	}
}
