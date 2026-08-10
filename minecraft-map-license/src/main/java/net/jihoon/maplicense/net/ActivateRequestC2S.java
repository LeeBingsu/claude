package net.jihoon.maplicense.net;

import io.netty.buffer.ByteBuf;
import net.jihoon.maplicense.MapLicense;
import net.minecraft.network.codec.PacketCodec;
import net.minecraft.network.codec.PacketCodecs;
import net.minecraft.network.packet.CustomPayload;

/** A code the player typed into the activation screen, on its way to the server. */
public record ActivateRequestC2S(String code) implements CustomPayload {
	public static final CustomPayload.Id<ActivateRequestC2S> ID =
			new CustomPayload.Id<>(MapLicense.id("activate"));

	/** Bounded well under any real code length so a hostile client cannot flood the handler. */
	public static final PacketCodec<ByteBuf, ActivateRequestC2S> CODEC = PacketCodec.tuple(
			PacketCodecs.string(64), ActivateRequestC2S::code,
			ActivateRequestC2S::new);

	@Override
	public CustomPayload.Id<? extends CustomPayload> getId() {
		return ID;
	}
}
