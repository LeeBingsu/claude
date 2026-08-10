package net.jihoon.maplicense;

import net.minecraft.text.MutableText;
import net.minecraft.text.Text;

/**
 * Server-sent text, carrying an English fallback alongside the translation key.
 *
 * <p>A player can reach a modded dedicated server without the mod on their own
 * client. Their game has none of this mod's lang files, so a plain translatable
 * would render as the raw key - {@code message.map-license.invalid} rather than
 * a sentence. The fallback is what such a client shows; everyone else still gets
 * their own language from the lang files.
 *
 * <p>These strings mirror {@code assets/map_license/lang/en_us.json}. Change one
 * and change the other.
 */
public final class Messages {
	private Messages() {
	}

	public static MutableText of(String key, Object... args) {
		return Text.translatableWithFallback(key, fallback(key), args);
	}

	private static String fallback(String key) {
		return switch (key) {
			case "message.map-license.activated" ->
					"Activated. This map is now unlocked for your account.";
			case "message.map-license.already-active" ->
					"Your account already owns this map.";
			case "message.map-license.already-used" ->
					"That code has already been used.";
			case "message.map-license.empty" ->
					"Enter your activation code.";
			case "message.map-license.invalid" ->
					"That code is not valid.";
			case "message.map-license.not-gated" ->
					"This world does not require a licence.";
			case "message.map-license.timeout" ->
					"No activation code was entered.";
			case "message.map-license.too-many-attempts" ->
					"Too many attempts. Wait a moment and try again.";
			case "message.map-license.status-active" ->
					"%s is unlocked for your account (activated %s).";
			case "message.map-license.status-locked" ->
					"%s is locked. Enter your activation code to play.";
			case "message.map-license.revoked" ->
					"Revoked %s's activation. Their code stays spent.";
			case "message.map-license.revoke-missing" ->
					"%s has no activation for this map.";
			default -> key;
		};
	}
}
