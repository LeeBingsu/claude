package net.jihoon.swordholdattack;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import net.fabricmc.loader.api.FabricLoader;

import java.io.IOException;
import java.io.Reader;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * JSON-backed settings, read once at startup from
 * .minecraft/config/sword-hold-attack.json. Editing the file needs a game
 * restart, and an existing file is never overwritten by a mod update.
 */
public class ModConfig {

	private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
	private static final Path PATH = FabricLoader.getInstance().getConfigDir().resolve("sword-hold-attack.json");

	/** Master switch. */
	public boolean enabled = true;

	/** Max eye-to-target distance in blocks. Vanilla entity reach is 3.0. */
	public double maxReach = 3.0;

	/**
	 * Ticks between swings, rolled fresh for each one. 20 ticks = 1 second, so
	 * the defaults are 0.60s to 0.75s.
	 *
	 * <p>Varying the interval rather than a charge threshold is what actually
	 * produces spread. A sword charges in 12.5 ticks, so any interval at or
	 * above 13 lands at full charge - the interval keeps varying while damage
	 * per swing stays maximal. Going below 11 drops under
	 * {@link AttackThresholds#CRIT_AND_SWEEP} and gives up crits and sweeps.
	 */
	public int minIntervalTicks = 12;
	public int maxIntervalTicks = 15;

	/**
	 * Hard floor - a swing is held back until charge reaches this, whatever the
	 * rolled interval says. Guards the case where something else reset the
	 * cooldown, so the crit/sweep guarantee cannot be lost by accident.
	 */
	public float minCharge = AttackThresholds.CRIT_AND_SWEEP;

	private static ModConfig instance = new ModConfig();

	public static ModConfig get() {
		return instance;
	}

	public static void load() {
		if (Files.exists(PATH)) {
			try (Reader reader = Files.newBufferedReader(PATH, StandardCharsets.UTF_8)) {
				ModConfig loaded = GSON.fromJson(reader, ModConfig.class);
				if (loaded != null) {
					instance = loaded;
				}
			} catch (IOException e) {
				System.err.println("[sword-hold-attack] Failed to read config, using defaults: " + e.getMessage());
			}
		} else {
			save();
		}
	}

	public static void save() {
		try {
			Files.createDirectories(PATH.getParent());
			try (Writer writer = Files.newBufferedWriter(PATH, StandardCharsets.UTF_8)) {
				GSON.toJson(instance, writer);
			}
		} catch (IOException e) {
			System.err.println("[sword-hold-attack] Failed to write config: " + e.getMessage());
		}
	}
}
