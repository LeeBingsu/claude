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
import java.util.UUID;

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
	private final Set<String> boundHashes;

	private LicenseCodes(byte[] salt, Set<String> hashes, Set<String> boundHashes) {
		this.salt = salt;
		this.hashes = hashes;
		this.boundHashes = boundHashes;
	}

	public static LicenseCodes load() {
		try (InputStream in = LicenseCodes.class.getResourceAsStream(RESOURCE)) {
			if (in == null) {
				MapLicense.LOGGER.error("{} is missing from the jar; no code can be activated.", RESOURCE);
				return new LicenseCodes(new byte[0], Set.of(), Set.of());
			}

			JsonObject json = JsonParser.parseReader(new InputStreamReader(in, StandardCharsets.UTF_8))
					.getAsJsonObject();

			byte[] salt = Base64.getDecoder().decode(json.get("salt").getAsString());

			Set<String> hashes = new HashSet<>();
			json.getAsJsonArray("hashes").forEach(element -> hashes.add(element.getAsString()));

			// Absent in files written before account-bound codes existed.
			Set<String> boundHashes = new HashSet<>();
			if (json.has("boundHashes")) {
				json.getAsJsonArray("boundHashes").forEach(element -> boundHashes.add(element.getAsString()));
			}

			return new LicenseCodes(salt, Set.copyOf(hashes), Set.copyOf(boundHashes));
		} catch (Exception e) {
			MapLicense.LOGGER.error("Could not read {}; no code can be activated.", RESOURCE, e);
			return new LicenseCodes(new byte[0], Set.of(), Set.of());
		}
	}

	public int size() {
		return hashes.size() + boundHashes.size();
	}

	public boolean isEmpty() {
		return hashes.isEmpty() && boundHashes.isEmpty();
	}

	/** True for a code any account may redeem. */
	public boolean contains(String hash) {
		return hashes.contains(hash);
	}

	/** True for a code minted for one specific account. */
	public boolean containsBound(String hash) {
		return boundHashes.contains(hash);
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
		return digest(normalizedCode, null);
	}

	/**
	 * Digest of a code as redeemed by one specific account.
	 *
	 * <p>Mixing the player's UUID into the digest is what makes a leaked code
	 * useless to anyone else: the same code typed on another account produces a
	 * different digest, which is not in the list, so it reads as an unknown code.
	 * Nothing about the intended owner is revealed by the failure, because all
	 * the jar holds is digests.
	 */
	public String hash(String normalizedCode, UUID owner) {
		return digest(normalizedCode, owner);
	}

	private String digest(String normalizedCode, UUID owner) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			digest.update(salt);
			digest.update(normalizedCode.getBytes(StandardCharsets.UTF_8));

			if (owner != null) {
				digest.update(owner.toString().getBytes(StandardCharsets.UTF_8));
			}

			return Base64.getEncoder().encodeToString(digest.digest());
		} catch (Exception e) {
			throw new IllegalStateException("SHA-256 unavailable", e);
		}
	}
}
