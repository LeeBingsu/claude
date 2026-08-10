package net.jihoon.maplicense.net;

import io.netty.buffer.ByteBuf;
import net.jihoon.maplicense.GateConfig;
import net.jihoon.maplicense.MapLicense;
import net.minecraft.network.codec.PacketCodec;
import net.minecraft.network.codec.PacketCodecs;
import net.minecraft.network.packet.CustomPayload;

/**
 * Tells the client whether this world wants a code, and what to call the map on
 * the prompt.
 */
public record GatePromptS2C(String mapId, String title, boolean locked) implements CustomPayload {
	public static final CustomPayload.Id<GatePromptS2C> ID =
			new CustomPayload.Id<>(MapLicense.id("gate_prompt"));

	public static final PacketCodec<ByteBuf, GatePromptS2C> CODEC = PacketCodec.tuple(
			PacketCodecs.string(128), GatePromptS2C::mapId,
			PacketCodecs.string(128), GatePromptS2C::title,
			PacketCodecs.VAR_INT, payload -> payload.locked() ? 1 : 0,
			(mapId, title, locked) -> new GatePromptS2C(mapId, title, locked != 0));

	public static GatePromptS2C locked(GateConfig gate) {
		return new GatePromptS2C(gate.mapId(), gate.title(), true);
	}

	public static GatePromptS2C unlocked(GateConfig gate) {
		return new GatePromptS2C(gate.mapId(), gate.title(), false);
	}

	@Override
	public CustomPayload.Id<? extends CustomPayload> getId() {
		return ID;
	}
}
