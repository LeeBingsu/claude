package net.jihoon.macestunslam;

import net.minecraft.client.MinecraftClient;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.util.hit.BlockHitResult;
import net.minecraft.util.hit.HitResult;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.RaycastContext;

/**
 * Answers "how many ticks until this fall ends" so the slam can be held until
 * the last safe moment. The smash bonus scales with fall distance, so firing
 * early throws damage away - but overshooting means landing without a hit and
 * eating the fall damage the smash would have cancelled.
 */
public class FallPredictor {

	/** Per-tick player gravity: v = (v - 0.08) * 0.98. */
	private static final double GRAVITY = 0.08;
	private static final double DRAG = 0.98;

	/** Give up scanning past this; a fall longer than this is treated as bottomless. */
	private static final double MAX_SCAN_DISTANCE = 256.0;
	private static final int MAX_SIMULATED_TICKS = 400;

	/** Returned when no ground was found within {@link #MAX_SCAN_DISTANCE}. */
	public static final int NO_IMPACT = Integer.MAX_VALUE;

	public int ticksToImpact(MinecraftClient client, PlayerEntity player) {
		double distance = distanceToGround(client, player);
		if (distance < 0) {
			return NO_IMPACT;
		}

		double velocityY = player.getVelocity().y;
		double travelled = 0.0;

		for (int tick = 1; tick <= MAX_SIMULATED_TICKS; tick++) {
			velocityY = (velocityY - GRAVITY) * DRAG;
			travelled -= velocityY;
			if (travelled >= distance) {
				return tick;
			}
		}
		return NO_IMPACT;
	}

	/**
	 * @return distance in blocks from the player's feet to the first collidable
	 *         block below, or -1 when nothing is within range.
	 */
	private double distanceToGround(MinecraftClient client, PlayerEntity player) {
		// Built from the coordinate getters rather than a position accessor:
		// getPos() no longer resolves in 1.21.11, while getX/getY/getZ are stable.
		Vec3d start = new Vec3d(player.getX(), player.getY(), player.getZ());
		Vec3d end = start.subtract(0.0, MAX_SCAN_DISTANCE, 0.0);

		BlockHitResult hit = client.world.raycast(new RaycastContext(
				start,
				end,
				RaycastContext.ShapeType.COLLIDER,
				RaycastContext.FluidHandling.NONE,
				player
		));

		if (hit.getType() == HitResult.Type.MISS) {
			return -1.0;
		}
		return start.y - hit.getPos().y;
	}
}
