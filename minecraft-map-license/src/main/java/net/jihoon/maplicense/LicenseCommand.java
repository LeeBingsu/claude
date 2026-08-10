package net.jihoon.maplicense;

import com.mojang.brigadier.arguments.StringArgumentType;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.minecraft.command.argument.EntityArgumentType;
import net.minecraft.server.command.CommandManager;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Chat-side entry points: a fallback for activating without the screen, plus the
 * two commands the map author needs (world fingerprint, and revoking a binding).
 */
public final class LicenseCommand {
	private static final DateTimeFormatter TIMESTAMP =
			DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(ZoneId.systemDefault());

	private LicenseCommand() {
	}

	public static void register() {
		CommandRegistrationCallback.EVENT.register((dispatcher, registryAccess, environment) ->
				dispatcher.register(CommandManager.literal("maplicense")
						.then(CommandManager.literal("activate")
								.then(CommandManager.argument("code", StringArgumentType.greedyString())
										.executes(context -> {
											ServerPlayerEntity player = context.getSource().getPlayerOrThrow();
											MapLicense.handleActivation(player,
													StringArgumentType.getString(context, "code"));
											return 1;
										})))
						.then(CommandManager.literal("status")
								.executes(context -> status(context.getSource())))
						.then(CommandManager.literal("fingerprint")
								.requires(CommandManager.requirePermissionLevel(CommandManager.GAMEMASTERS_CHECK))
								.executes(context -> fingerprint(context.getSource())))
						.then(CommandManager.literal("revoke")
								.requires(CommandManager.requirePermissionLevel(CommandManager.ADMINS_CHECK))
								.then(CommandManager.argument("player", EntityArgumentType.player())
										.executes(context -> revoke(context.getSource(),
												EntityArgumentType.getPlayer(context, "player")))))));
	}

	private static int status(ServerCommandSource source) throws com.mojang.brigadier.exceptions.CommandSyntaxException {
		ServerPlayerEntity player = source.getPlayerOrThrow();

		if (!MapLicense.isGatedWorld()) {
			source.sendFeedback(() -> Text.translatable("message.map-license.not-gated"), false);
			return 1;
		}

		long activatedAt = MapLicense.store().activatedAt(MapLicense.gate().mapId(), player.getUuid());
		if (activatedAt < 0) {
			source.sendFeedback(() -> Text.translatable("message.map-license.status-locked",
					MapLicense.gate().title()), false);
			return 0;
		}

		source.sendFeedback(() -> Text.translatable("message.map-license.status-active",
				MapLicense.gate().title(), TIMESTAMP.format(Instant.ofEpochMilli(activatedAt))), false);
		return 1;
	}

	private static int fingerprint(ServerCommandSource source) {
		String description = WorldGate.describe(source.getServer());
		source.sendFeedback(() -> Text.literal(description), false);
		MapLicense.LOGGER.info("World fingerprint: {}", description);
		return 1;
	}

	private static int revoke(ServerCommandSource source, ServerPlayerEntity target) {
		boolean removed = MapLicense.store().revoke(MapLicense.gate().mapId(), target.getUuid());

		if (removed) {
			LicenseFlag.set(target, false);
			source.sendFeedback(() -> Text.translatable("message.map-license.revoked",
					target.getGameProfile().name()), true);
			return 1;
		}

		source.sendError(Text.translatable("message.map-license.revoke-missing",
				target.getGameProfile().name()));
		return 0;
	}
}
