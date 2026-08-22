"""Generate pack.png (128x128) for the resource pack: a music note over a dark, ore-red gradient."""
import math
import struct
import sys
import zlib

SIZE = 128


def lerp(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def build_pixels():
    top = (26, 22, 30)
    bottom = (74, 18, 22)
    glow = (214, 84, 52)
    note = (240, 226, 210)

    px = [[lerp(top, bottom, y / (SIZE - 1)) for x in range(SIZE)] for y in range(SIZE)]

    # radial glow behind the note
    cx, cy = 62.0, 74.0
    for y in range(SIZE):
        for x in range(SIZE):
            d = math.hypot(x - cx, y - cy)
            t = max(0.0, 1.0 - d / 70.0) ** 2 * 0.55
            px[y][x] = lerp(px[y][x], glow, t)

    def disc(x, y, ox, oy, rx, ry, tilt=0.0):
        dx, dy = x - ox, y - oy
        dx -= dy * tilt
        return (dx / rx) ** 2 + (dy / ry) ** 2 <= 1.0

    for y in range(SIZE):
        for x in range(SIZE):
            on = False
            # note heads
            if disc(x, y, 46, 92, 16, 12, 0.32) or disc(x, y, 88, 82, 16, 12, 0.32):
                on = True
            # stems
            if 58 <= x <= 65 and 36 <= y <= 93:
                on = True
            if 100 <= x <= 107 and 26 <= y <= 83:
                on = True
            # beam joining the stems
            if 58 <= x <= 107 and 26 + (x - 58) * -0.2 <= y <= 44 + (x - 58) * -0.2:
                on = True
            if on:
                px[y][x] = note

    return px


def write_png(path, px):
    raw = b"".join(
        b"\x00" + b"".join(struct.pack("BBB", *px[y][x]) for x in range(SIZE))
        for y in range(SIZE)
    )

    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


if __name__ == "__main__":
    write_png(sys.argv[1], build_pixels())
    print("wrote", sys.argv[1])
