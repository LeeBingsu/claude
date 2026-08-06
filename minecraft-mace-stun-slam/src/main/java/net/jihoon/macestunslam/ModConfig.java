package net.jihoon.macestunslam;

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
 * Simple JSON-backed settings, loaded once at startup from
 * .minecraft/config/mace-stun-slam.json.
 */
public class ModConfig {

	private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
	private static final Path PATH = FabricLoader.getInstance().getConfigDir().resolve("mace-stun-slam.json");

	/** Minimum fall distance (blocks) required before an auto-attack will fire. */
	public float minFallDistance = 1.5f;

	/** Max distance (blocks) to the crosshair-targeted entity for an auto-attack to fire. */
	public double attackRangeBlocks = 4.0;

	/** Ticks to wait after a successful slam before another can trigger. */
	public int cooldownTicks = 10;

	/** Whether pressing the key while grounded should trigger a jump automatically. */
	public boolean autoJump = true;

	/** Whether holding the key while gliding should swap the elytra out for a chestplate. */
	public boolean autoSwapElytra = true;

	/** Ticks to wait after an elytra swap before another swap may be issued. */
	public int swapCooldownTicks = 10;

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
				System.err.println("[mace-stun-slam] Failed to read config, using defaults: " + e.getMessage());
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
			System.err.println("[mace-stun-slam] Failed to write config: " + e.getMessage());
		}
	}
}
