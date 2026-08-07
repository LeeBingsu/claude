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

	/** Whether to switch to the mace for the slam and back to the sword afterwards. */
	public boolean attributeSwap = true;

	/** Required attack charge (0.0-1.0), read with the mace held, before the slam fires. */
	public float minAttackCooldownProgress = 1.0f;

	/** Ticks after a slam before switching back to the sword. */
	public int swapBackToSwordDelayTicks = 1;

	/** Hotbar index (0-8) holding the mace, or -1 to scan the hotbar for one. */
	public int maceHotbarSlot = -1;

	/** Hotbar index (0-8) holding the sword, or -1 to scan the hotbar for one. */
	public int swordHotbarSlot = -1;

	/** Hold the slam until just before landing, trading airtime for smash damage. */
	public boolean maxDamageMode = true;

	/** Ticks before predicted impact at which the held slam is released. Raise on high ping. */
	public int releaseMarginTicks = 2;

	/** Charge floor for firing an undercharged slam rather than landing without one. */
	public float minSalvageCharge = 0.5f;

	/** Vary the mod's fixed tick gaps instead of firing on the same offsets every time. */
	public boolean humanize = true;

	/** Ticks between the key going down and the sequence starting. */
	public int reactionDelayMinTicks = 1;
	public int reactionDelayMaxTicks = 4;

	/** Ticks to wait after a hotbar change before attacking. Never below 1. */
	public int swapSettleMinTicks = 1;
	public int swapSettleMaxTicks = 3;

	/** Ticks between clicks of the three-click elytra swap. */
	public int inventoryClickSpacingMinTicks = 1;
	public int inventoryClickSpacingMaxTicks = 3;

	/** Extra ticks added to releaseMarginTicks per fall. Only ever fires earlier. */
	public int releaseMarginJitterTicks = 1;

	/** Master switch for held-left-click sword attacking. */
	public boolean autoAttack = true;

	/** Max eye-to-target distance in blocks. Vanilla entity reach is 3.0; above that the server rejects the hit. */
	public double autoAttackMaxReach = 3.0;

	/**
	 * Attack charge required per swing, rolled fresh between these bounds each
	 * time. Set both to the same value for a fixed threshold; 1.0 is maximum
	 * damage but fires at a charge no human input can produce.
	 */
	public float autoAttackMinCharge = 0.80f;
	public float autoAttackMaxCharge = 0.90f;

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
