package net.jihoon.maplicense;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * The set of codes this build will accept, stored as salted SHA-256 digests.
 *
 * <p>Only digests ship in the jar. Unpacking the mod therefore yields no usable
 * code and no key to mint new ones - the plaintext codes exist solely in the
 * file the map author keeps. Codes carry 80 bits of entropy, which is far past
 * the point where guessing against a digest list is worth anyone's time.
 */
public final class LicenseCodes {
	private static final String RESOURCE = "/map-license/codes.json";

	/**
	 * Crockford base32: no I, L, O or U, so there is no 1/I or 0/O ambiguity for
	 * a buyer typing a code off a receipt.
	 */
	private static final String ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

	private final byte[] salt;
	private final Set<String> hashes;

	private LicenseCodes(byte[] salt, Set<String> hashes) {
		this.salt = salt;
		this.hashes = hashes;
	}

	public static LicenseCodes load() {
		try (InputStream in = LicenseCodes.class.getResourceAsStream(RESOURCE)) {
			if (in == null) {
				MapLicense.LOGGER.error("{} is missing from the jar; no code can be activated.", RESOURCE);
				return new LicenseCodes(new byte[0], Set.of());
			}

			JsonObject json = JsonParser.parseReader(new InputStreamReader(in, StandardCharsets.UTF_8))
					.getAsJsonObject();

			byte[] salt = Base64.getDecoder().decode(json.get("salt").getAsString());
			Set<String> hashes = new HashSet<>();
			json.getAsJsonArray("hashes").forEach(element -> hashes.add(element.getAsString()));

			return new LicenseCodes(salt, Set.copyOf(hashes));
		} catch (Exception e) {
			MapLicense.LOGGER.error("Could not read {}; no code can be activated.", RESOURCE, e);
			return new LicenseCodes(new byte[0], Set.of());
		}
	}

	public int size() {
		return hashes.size();
	}

	public boolean isEmpty() {
		return hashes.isEmpty();
	}

	public boolean contains(String hash) {
		return hashes.contains(hash);
	}

	/**
	 * Folds a typed code into its canonical form: case, separators and the
	 * lookalike characters Crockford base32 leaves out are all forgiven, so
	 * "abcd efgh-ijkl mnop" and "ABCD-EFGH-1JK1-MN0P" reach the same digest.
	 */
	public static String normalize(String raw) {
		if (raw == null) {
			return "";
		}

		StringBuilder out = new StringBuilder(raw.length());
		for (char c : raw.toUpperCase(Locale.ROOT).toCharArray()) {
			char mapped = switch (c) {
				case 'I', 'L' -> '1';
				case 'O' -> '0';
				case 'U' -> 'V';
				default -> c;
			};

			if (ALPHABET.indexOf(mapped) >= 0) {
				out.append(mapped);
			}
		}

		return out.toString();
	}

	/** Digest of an already-normalized code, base64 encoded to match codes.json. */
	public String hash(String normalizedCode) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			digest.update(salt);
			digest.update(normalizedCode.getBytes(StandardCharsets.UTF_8));
			return Base64.getEncoder().encodeToString(digest.digest());
		} catch (Exception e) {
			throw new IllegalStateException("SHA-256 unavailable", e);
		}
	}
}
