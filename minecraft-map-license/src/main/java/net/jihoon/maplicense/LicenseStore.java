package net.jihoon.maplicense;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import net.fabricmc.loader.api.FabricLoader;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

/**
 * The record of which code was redeemed by which account, kept next to the game
 * rather than on a server.
 *
 * <p>Each row carries an HMAC so a hand-edited entry is spotted and dropped.
 * That stops a text editor, not a decompiler - with no server in the design
 * there is no secret the player's machine does not also hold. The mod jar is
 * the only thing standing between a determined attacker and a forged row, and
 * it is documented that way in the README rather than pretended otherwise.
 */
public final class LicenseStore {
	private static final Path FILE = FabricLoader.getInstance().getConfigDir()
			.resolve(MapLicense.MOD_ID).resolve("activations.json");

	/**
	 * Not a security boundary - it only makes the stored rows tamper-evident.
	 * Change it before you ship so records from someone else's build do not
	 * validate against yours.
	 */
	private static final byte[] INTEGRITY_KEY =
			"map-license/change-me-before-release".getBytes(StandardCharsets.UTF_8);

	private final List<Activation> entries;

	private LicenseStore(List<Activation> entries) {
		this.entries = entries;
	}

	private record Activation(String mapId, UUID uuid, String name, String codeHash, long activatedAt) {
		String signingInput() {
			return mapId + "|" + uuid + "|" + codeHash + "|" + activatedAt;
		}
	}

	public static LicenseStore load() {
		List<Activation> loaded = new ArrayList<>();

		if (Files.isRegularFile(FILE)) {
			try (BufferedReader reader = Files.newBufferedReader(FILE, StandardCharsets.UTF_8)) {
				JsonObject root = JsonParser.parseReader(reader).getAsJsonObject();
				JsonArray array = root.getAsJsonArray("entries");

				for (int i = 0; i < array.size(); i++) {
					JsonObject row = array.get(i).getAsJsonObject();
					Activation activation = new Activation(
							row.get("mapId").getAsString(),
							UUID.fromString(row.get("uuid").getAsString()),
							row.get("name").getAsString(),
							row.get("codeHash").getAsString(),
							row.get("activatedAt").getAsLong());

					if (mac(activation).equals(row.get("mac").getAsString())) {
						loaded.add(activation);
					} else {
						MapLicense.LOGGER.warn("Dropping activation row for {} - integrity check failed",
								activation.name());
					}
				}
			} catch (Exception e) {
				MapLicense.LOGGER.error("Could not read {}; starting from an empty record.", FILE, e);
				loaded.clear();
			}
		}

		return new LicenseStore(loaded);
	}

	public synchronized int size() {
		return entries.size();
	}

	public synchronized boolean isActivated(String mapId, UUID uuid) {
		return entries.stream().anyMatch(e -> e.mapId().equals(mapId) && e.uuid().equals(uuid));
	}

	public synchronized boolean isCodeUsed(String mapId, String codeHash) {
		return entries.stream().anyMatch(e -> e.mapId().equals(mapId) && e.codeHash().equals(codeHash));
	}

	public synchronized void activate(String mapId, UUID uuid, String name, String codeHash) {
		entries.add(new Activation(mapId, uuid, name, codeHash, System.currentTimeMillis()));
		save();
	}

	/**
	 * Frees the account binding while keeping the code itself spent, so a
	 * mistyped-account support case can be fixed without handing out a code that
	 * would then work twice.
	 */
	public synchronized boolean revoke(String mapId, UUID uuid) {
		boolean removed = entries.removeIf(e -> e.mapId().equals(mapId) && e.uuid().equals(uuid));
		if (removed) {
			save();
		}
		return removed;
	}

	/** When this account activated, or -1 if it never did. */
	public synchronized long activatedAt(String mapId, UUID uuid) {
		return entries.stream()
				.filter(e -> e.mapId().equals(mapId) && e.uuid().equals(uuid))
				.mapToLong(Activation::activatedAt)
				.findFirst()
				.orElse(-1L);
	}

	private void save() {
		JsonArray array = new JsonArray();
		for (Activation activation : entries) {
			JsonObject row = new JsonObject();
			row.addProperty("mapId", activation.mapId());
			row.addProperty("uuid", activation.uuid().toString());
			row.addProperty("name", activation.name());
			row.addProperty("codeHash", activation.codeHash());
			row.addProperty("activatedAt", activation.activatedAt());
			row.addProperty("mac", mac(activation));
			array.add(row);
		}

		JsonObject root = new JsonObject();
		root.addProperty("version", 1);
		root.add("entries", array);

		try {
			Files.createDirectories(FILE.getParent());
			Path temp = FILE.resolveSibling(FILE.getFileName() + ".tmp");

			try (BufferedWriter writer = Files.newBufferedWriter(temp, StandardCharsets.UTF_8)) {
				writer.write(root.toString());
			}

			Files.move(temp, FILE, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
		} catch (Exception e) {
			MapLicense.LOGGER.error("Could not write {}", FILE, e);
		}
	}

	private static String mac(Activation activation) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(INTEGRITY_KEY, "HmacSHA256"));
			return Base64.getEncoder()
					.encodeToString(mac.doFinal(activation.signingInput().getBytes(StandardCharsets.UTF_8)));
		} catch (Exception e) {
			throw new IllegalStateException("HmacSHA256 unavailable", e);
		}
	}
}
