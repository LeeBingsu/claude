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
<<<<<<< HEAD
	 * Seconds between swings, rolled fresh for each one as a real number.
	 *
	 * <p>The fraction matters even though attacks only leave on tick boundaries.
	 * A target of 11.7 ticks fires on tick 12; one of 10.2 fires on tick 11. The
	 * fractional part therefore sets how often each whole tick comes up, and
	 * that distribution is the thing an observer can actually measure. Rolling
	 * whole ticks instead would give a flat split across two values, which is
	 * not a shape human clicking produces.
	 */
	public double minIntervalSeconds = 0.5;
	public double maxIntervalSeconds = 0.625;
=======
	 * Ticks between swings, rolled fresh for each one. 20 ticks = 1 second, so
	 * the defaults are 0.60s to 0.75s.
	 *
	 * <p>Varying the interval rather than a charge threshold is what actually
	 * produces spread. A sword charges in 12.5 ticks, so any interval at or
	 * above 13 lands at full charge - the interval keeps varying while damage
	 * per swing stays maximal. Going below 11 drops under
	 * {@link AttackThresholds#CRIT_AND_SWEEP} and gives up crits and sweeps.
	 *
	 * <p>Sub-tick values are not expressible and would not matter: attacks leave
	 * on tick boundaries, and the server buckets them into its own ticks either
	 * way, so nothing downstream can observe finer timing than this.
	 */
	public int minIntervalTicks = 11;
	public int maxIntervalTicks = 12;
>>>>>>> 9df52b028dd897d3df4a544ab059836699cafba8

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
