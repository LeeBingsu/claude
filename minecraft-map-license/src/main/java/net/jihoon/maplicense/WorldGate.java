package net.jihoon.maplicense;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import net.minecraft.server.MinecraftServer;
import net.minecraft.util.WorldSavePath;

import java.io.BufferedReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

/**
 * Decides whether the save that is currently open is the protected map.
 *
 * <p>Three independent signals are checked and any one of them is enough. That
 * is on purpose: a marker file can be deleted and a folder can be renamed, but
 * the world seed lives in level.dat and editing it desyncs terrain that has not
 * been pre-generated. Someone stripping the gate has to find and defeat all of
 * them rather than the first one they notice.
 */
public final class WorldGate {
	private WorldGate() {
	}

	public record Result(boolean gated, String reason) {
	}

	public static Result evaluate(MinecraftServer server, GateConfig gate) {
		String levelName = server.getSaveProperties().getLevelName();
		if (levelName != null && gate.worldNames().contains(levelName.toLowerCase(Locale.ROOT))) {
			return new Result(true, "world name '" + levelName + "'");
		}

		long seed = server.getOverworld().getSeed();
		if (gate.seeds().contains(seed)) {
			return new Result(true, "world seed " + seed);
		}

		if (hasMarker(server, gate)) {
			return new Result(true, "marker file " + gate.markerFile());
		}

		if (gate.worldNames().isEmpty() && gate.seeds().isEmpty()) {
			return new Result(false, "no world signals configured - run /maplicense fingerprint and fill in gate.json");
		}

		return new Result(false, "no signal matched");
	}

	private static boolean hasMarker(MinecraftServer server, GateConfig gate) {
		Path marker = server.getSavePath(WorldSavePath.ROOT).resolve(gate.markerFile());
		if (!Files.isRegularFile(marker)) {
			return false;
		}

		try (BufferedReader reader = Files.newBufferedReader(marker, StandardCharsets.UTF_8)) {
			JsonObject json = JsonParser.parseReader(reader).getAsJsonObject();
			return json.has("mapId") && gate.mapId().equals(json.get("mapId").getAsString());
		} catch (Exception e) {
			MapLicense.LOGGER.warn("Marker file {} could not be read", marker, e);
			return false;
		}
	}

	/** Human-readable fingerprint of the open world, for filling in gate.json. */
	public static String describe(MinecraftServer server) {
		return "levelName=\"" + server.getSaveProperties().getLevelName() + "\", seed="
				+ server.getOverworld().getSeed();
	}
}
