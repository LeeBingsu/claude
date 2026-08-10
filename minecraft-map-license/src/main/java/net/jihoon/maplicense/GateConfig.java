package net.jihoon.maplicense;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Describes which world is the protected map.
 *
 * <p>Deliberately read from the jar ({@code /map-license/gate.json}) and not from
 * the config directory: a file the player can edit is a file the player can
 * empty, which would turn the gate off without touching a single class file.
 */
public final class GateConfig {
	private static final String RESOURCE = "/map-license/gate.json";

	private final String mapId;
	private final String title;
	private final String markerFile;
	private final List<String> worldNames;
	private final List<Long> seeds;
	private final int lockTimeoutSeconds;

	private GateConfig(String mapId, String title, String markerFile, List<String> worldNames, List<Long> seeds,
			int lockTimeoutSeconds) {
		this.mapId = mapId;
		this.title = title;
		this.markerFile = markerFile;
		this.worldNames = worldNames;
		this.seeds = seeds;
		this.lockTimeoutSeconds = lockTimeoutSeconds;
	}

	public String mapId() {
		return mapId;
	}

	public String title() {
		return title;
	}

	public String markerFile() {
		return markerFile;
	}

	public List<String> worldNames() {
		return worldNames;
	}

	public List<Long> seeds() {
		return seeds;
	}

	public int lockTimeoutSeconds() {
		return lockTimeoutSeconds;
	}

	public static GateConfig load() {
		try (InputStream in = GateConfig.class.getResourceAsStream(RESOURCE)) {
			if (in == null) {
				MapLicense.LOGGER.error("{} is missing from the jar; the gate is disabled.", RESOURCE);
				return fallback();
			}

			JsonObject json = JsonParser.parseReader(new InputStreamReader(in, StandardCharsets.UTF_8))
					.getAsJsonObject();

			List<String> names = new ArrayList<>();
			if (json.has("worldNames")) {
				json.getAsJsonArray("worldNames")
						.forEach(element -> names.add(element.getAsString().toLowerCase(Locale.ROOT)));
			}

			List<Long> seeds = new ArrayList<>();
			if (json.has("seeds")) {
				json.getAsJsonArray("seeds").forEach(element -> seeds.add(element.getAsLong()));
			}

			return new GateConfig(
					json.has("mapId") ? json.get("mapId").getAsString() : "unnamed-map",
					json.has("title") ? json.get("title").getAsString() : "Protected map",
					json.has("markerFile") ? json.get("markerFile").getAsString() : "map-license.json",
					List.copyOf(names),
					List.copyOf(seeds),
					json.has("lockTimeoutSeconds") ? json.get("lockTimeoutSeconds").getAsInt() : 300);
		} catch (Exception e) {
			MapLicense.LOGGER.error("Could not read {}; the gate is disabled.", RESOURCE, e);
			return fallback();
		}
	}

	private static GateConfig fallback() {
		return new GateConfig("unnamed-map", "Protected map", "map-license.json", List.of(), List.of(), 300);
	}
}
