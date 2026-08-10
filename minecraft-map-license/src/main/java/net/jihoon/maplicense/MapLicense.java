package net.jihoon.maplicense;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.fabricmc.fabric.api.networking.v1.PayloadTypeRegistry;
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents;
import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;
import net.jihoon.maplicense.net.ActivateRequestC2S;
import net.jihoon.maplicense.net.ActivationResultS2C;
import net.jihoon.maplicense.net.GatePromptS2C;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Gates a specific world behind a one-time activation code that binds to the
 * player's account UUID.
 *
 * <p>Everything here runs on the logical server: in single player that is the
 * integrated server inside the player's own game, on a dedicated server it is
 * the host. The client half of the mod only draws the activation prompt.
 */
public class MapLicense implements ModInitializer {
	public static final String MOD_ID = "map-license";
	public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

	private static final GateConfig GATE = GateConfig.load();
	private static final LicenseCodes CODES = LicenseCodes.load();
	private static final LicenseStore STORE = LicenseStore.load();
	private static final LockManager LOCKS = new LockManager();

	/** Whether the world currently loaded by this server is the protected map. */
	private static boolean gatedWorld;

	public static Identifier id(String path) {
		return Identifier.of(MOD_ID, path);
	}

	public static GateConfig gate() {
		return GATE;
	}

	public static LicenseStore store() {
		return STORE;
	}

	public static LockManager locks() {
		return LOCKS;
	}

	public static boolean isGatedWorld() {
		return gatedWorld;
	}

	@Override
	public void onInitialize() {
		PayloadTypeRegistry.playC2S().register(ActivateRequestC2S.ID, ActivateRequestC2S.CODEC);
		PayloadTypeRegistry.playS2C().register(GatePromptS2C.ID, GatePromptS2C.CODEC);
		PayloadTypeRegistry.playS2C().register(ActivationResultS2C.ID, ActivationResultS2C.CODEC);

		ServerPlayNetworking.registerGlobalReceiver(ActivateRequestC2S.ID,
				(payload, context) -> handleActivation(context.player(), payload.code()));

		ServerLifecycleEvents.SERVER_STARTED.register(this::onServerStarted);
		ServerPlayConnectionEvents.JOIN.register((handler, sender, server) -> onJoin(handler.player));
		ServerPlayConnectionEvents.DISCONNECT.register((handler, server) -> LOCKS.release(handler.player));
		ServerTickEvents.END_SERVER_TICK.register(LOCKS::tick);

		PlayerRestrictions.register();
		LicenseCommand.register();

		LOGGER.info("map-license loaded: map '{}', {} activation code(s) embedded, {} activation(s) on record",
				GATE.mapId(), CODES.size(), STORE.size());
	}

	private void onServerStarted(MinecraftServer server) {
		WorldGate.Result result = WorldGate.evaluate(server, GATE);
		gatedWorld = result.gated();

		if (gatedWorld) {
			LOGGER.info("Protected map detected ({}). Players need an activation code to play.", result.reason());
			if (CODES.isEmpty()) {
				LOGGER.error("No activation codes are embedded in this jar - nobody can activate. "
						+ "Run tools/generate_codes.py and rebuild.");
			}
		} else {
			LOGGER.info("This world is not the protected map ({}), so no license is required.", result.reason());
		}
	}

	private void onJoin(ServerPlayerEntity player) {
		if (!gatedWorld) {
			return;
		}

		boolean licensed = STORE.isActivated(GATE.mapId(), player.getUuid());
		LicenseFlag.set(player, licensed);

		if (licensed) {
			return;
		}

		LOCKS.lock(player);
		sendPrompt(player);
	}

	/**
	 * Asks the player for their code, by screen where possible and by chat where
	 * not.
	 *
	 * <p>On a dedicated server a player can arrive without the mod installed
	 * client-side. They would receive a payload they cannot decode, see nothing,
	 * and be disconnected five minutes later with no idea why - so they get told
	 * about the command instead. The text is literal rather than translated
	 * because the lang files ship with the mod they are missing.
	 */
	public static void sendPrompt(ServerPlayerEntity player) {
		if (ServerPlayNetworking.canSend(player, GatePromptS2C.ID)) {
			ServerPlayNetworking.send(player, GatePromptS2C.locked(GATE));
			return;
		}

		player.sendMessage(Text.literal("[" + GATE.title() + "] This map needs an activation code. "
				+ "Type: /maplicense activate <your code>"), false);
	}

	/**
	 * Validates a submitted code and, if it is good and unused, binds it to this
	 * player's UUID for good.
	 */
	public static void handleActivation(ServerPlayerEntity player, String rawCode) {
		if (!gatedWorld) {
			reject(player, "message.map-license.not-gated");
			return;
		}

		if (STORE.isActivated(GATE.mapId(), player.getUuid())) {
			accept(player, "message.map-license.already-active");
			return;
		}

		String code = LicenseCodes.normalize(rawCode);
		if (code.isEmpty()) {
			reject(player, "message.map-license.empty");
			return;
		}

		if (!LOCKS.consumeAttempt(player)) {
			reject(player, "message.map-license.too-many-attempts");
			return;
		}

		String codeHash = CODES.hash(code);
		if (!CODES.contains(codeHash)) {
			LOGGER.info("Rejected activation code from {} (invalid)", player.getGameProfile().name());
			reject(player, "message.map-license.invalid");
			return;
		}

		if (STORE.isCodeUsed(GATE.mapId(), codeHash)) {
			LOGGER.info("Rejected activation code from {} (already used)", player.getGameProfile().name());
			reject(player, "message.map-license.already-used");
			return;
		}

		STORE.activate(GATE.mapId(), player.getUuid(), player.getGameProfile().name(), codeHash);
		LOGGER.info("Activated '{}' for {} ({})", GATE.mapId(), player.getGameProfile().name(), player.getUuid());

		LicenseFlag.set(player, true);
		LOCKS.release(player);
		accept(player, "message.map-license.activated");

		if (ServerPlayNetworking.canSend(player, GatePromptS2C.ID)) {
			ServerPlayNetworking.send(player, GatePromptS2C.unlocked(GATE));
		}
	}

	private static void accept(ServerPlayerEntity player, String key) {
		respond(player, true, key);
	}

	private static void reject(ServerPlayerEntity player, String key) {
		respond(player, false, key);
	}

	/** Answers on the activation screen when there is one, in chat when there is not. */
	private static void respond(ServerPlayerEntity player, boolean ok, String key) {
		if (ServerPlayNetworking.canSend(player, ActivationResultS2C.ID)) {
			ServerPlayNetworking.send(player, new ActivationResultS2C(ok, key));
		} else {
			player.sendMessage(Messages.of(key), false);
		}
	}
}
