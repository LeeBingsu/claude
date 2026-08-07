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
	 * Charge required per swing, rolled fresh between these bounds each time.
	 * Both defaults sit above {@link AttackThresholds#CRIT_AND_SWEEP}, so every
	 * swing stays eligible for crits and sweep attacks. Dropping the lower bound
	 * under that cliff costs those outright, which is a far bigger loss than the
	 * damage multiplier alone suggests.
	 */
	public float minCharge = 0.85f;
	public float maxCharge = 0.95f;

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
