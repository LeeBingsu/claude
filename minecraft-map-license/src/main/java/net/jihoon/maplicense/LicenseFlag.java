package net.jihoon.maplicense;

import net.minecraft.scoreboard.Scoreboard;
import net.minecraft.scoreboard.ScoreboardCriterion;
import net.minecraft.scoreboard.ScoreboardObjective;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

/**
 * Mirrors each player's licence state into a scoreboard objective the map's own
 * command blocks and datapacks can read:
 *
 * <pre>execute if score @s maplicense matches 1 run ...</pre>
 *
 * <p>This is what stops "just delete the mod" from being the whole bypass. If
 * the map's progression is wired through this score, a world opened without the
 * mod never has the objective set, so the story never advances - the mod becomes
 * load-bearing content rather than an optional guard the player can remove.
 */
public final class LicenseFlag {
	public static final String OBJECTIVE = "maplicense";

	private LicenseFlag() {
	}

	public static void set(ServerPlayerEntity player, boolean licensed) {
		Scoreboard scoreboard = player.getEntityWorld().getServer().getScoreboard();
		ScoreboardObjective objective = scoreboard.getNullableObjective(OBJECTIVE);

		if (objective == null) {
			objective = scoreboard.addObjective(
					OBJECTIVE,
					ScoreboardCriterion.DUMMY,
					Text.literal("Map License"),
					ScoreboardCriterion.RenderType.INTEGER,
					false,
					null);
		}

		scoreboard.getOrCreateScore(player, objective).setScore(licensed ? 1 : 0);
	}
}
