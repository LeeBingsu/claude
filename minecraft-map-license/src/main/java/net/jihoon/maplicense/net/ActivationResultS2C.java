package net.jihoon.maplicense.net;

import io.netty.buffer.ByteBuf;
import net.jihoon.maplicense.MapLicense;
import net.minecraft.network.codec.PacketCodec;
import net.minecraft.network.codec.PacketCodecs;
import net.minecraft.network.packet.CustomPayload;

/**
 * The verdict on a submitted code. Carries a translation key rather than a
 * finished sentence so the prompt speaks the client's language, not the host's.
 */
public record ActivationResultS2C(boolean ok, String messageKey) implements CustomPayload {
	public static final CustomPayload.Id<ActivationResultS2C> ID =
			new CustomPayload.Id<>(MapLicense.id("activation_result"));

	public static final PacketCodec<ByteBuf, ActivationResultS2C> CODEC = PacketCodec.tuple(
			PacketCodecs.VAR_INT, payload -> payload.ok() ? 1 : 0,
			PacketCodecs.string(128), ActivationResultS2C::messageKey,
			(ok, messageKey) -> new ActivationResultS2C(ok != 0, messageKey));

	@Override
	public CustomPayload.Id<? extends CustomPayload> getId() {
		return ID;
	}
}
