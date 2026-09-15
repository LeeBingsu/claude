#!/usr/bin/env python3
"""Batch-convert manga/comic PNG scans to WebP.

Manga pages are screentone-heavy line art, which behaves the opposite way to
photographs: lossy WebP both destroys the halftone dots (moire, ringing around
text) and frequently produces a *larger* file than the source PNG. So this tool
defaults to lossless WebP, and the real savings come from dropping a scan that
was stored as RGB back down to grayscale.

Start with --benchmark to measure your own pages before converting anything:

    python3 tools/png2webp.py ./manga --benchmark 20
    python3 tools/png2webp.py ./manga --dry-run
    python3 tools/png2webp.py ./manga --delete-original
"""

import argparse
import os
import random
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

try:
    from PIL import Image, ImageChops
except ImportError:
    sys.exit("Pillow is required:  pip install pillow")

CWEBP = shutil.which("cwebp")


def is_truly_grayscale(img):
    """True if an RGB image carries no colour -- i.e. R == G == B everywhere.

    Dropping such an image to 8-bit grayscale throws away nothing at all, and it
    is the single biggest win on scans that were saved as 24-bit RGB.
    """
    if img.mode in ("L", "1"):
        return True
    if img.mode not in ("RGB", "RGBA"):
        return False
    r, g, b = img.convert("RGB").split()
    return (ImageChops.difference(r, g).getbbox() is None
            and ImageChops.difference(g, b).getbbox() is None)


def prepare(img, gray):
    """Normalise an image for encoding. Never lossy unless gray == 'force'.

    Returns (image, unchanged) -- `unchanged` means the file on disk can be fed
    to cwebp as-is.
    """
    original = img
    if img.mode == "P":
        img = img.convert("RGBA" if "transparency" in img.info else "RGB")
    # Manga scans almost never need an alpha channel; drop it when it is unused.
    if img.mode == "RGBA" and img.getchannel("A").getextrema() == (255, 255):
        img = img.convert("RGB")
    if gray == "force":
        return img.convert("L"), False
    if gray == "auto" and is_truly_grayscale(img):
        return img.convert("L"), False
    return img, img is original


def encode(img, out, *, lossless=True, quality=82, near_lossless=None,
           method=6, effort=7, passthrough=None):
    """Write a WebP. Uses the cwebp binary when available (better lossless).

    `passthrough` is the original PNG path, usable only when `prepare` left the
    image untouched -- cwebp reads PNG directly, so that skips a re-encode.
    """
    if CWEBP:
        src = passthrough
        tmp_png = None
        if src is None:
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                img.save(tmp.name, "PNG", compress_level=1)
                src = tmp_png = tmp.name
        try:
            cmd = [CWEBP, "-quiet", "-mt", str(src), "-o", str(out)]
            if lossless:
                cmd[4:4] = ["-lossless", "-z", str(effort)]
                if near_lossless is not None:
                    cmd[4:4] = ["-near_lossless", str(near_lossless)]
            else:
                cmd[4:4] = ["-q", str(quality), "-m", str(method), "-sharp_yuv"]
            subprocess.run(cmd, check=True, capture_output=True)
        finally:
            if tmp_png:
                os.unlink(tmp_png)
    else:
        if lossless:
            img.save(out, "WEBP", lossless=True, quality=100, method=method)
        else:
            img.save(out, "WEBP", quality=quality, method=method)
    return out.stat().st_size


def encode_bytes(img, **kw):
    """Encode to a throwaway file and return only the resulting byte count."""
    with tempfile.NamedTemporaryFile(suffix=".webp", delete=False) as tmp:
        path = Path(tmp.name)
    try:
        return encode(img, path, **kw)
    finally:
        path.unlink(missing_ok=True)


def convert(task):
    src, o = task
    dst = src.with_suffix(".webp")
    if dst.exists() and not o["overwrite"]:
        return src, "skipped", 0, 0
    try:
        with Image.open(src) as raw:
            raw.load()
            img, unchanged = prepare(raw, o["gray"])
            direct = src if unchanged else None
            size = encode(img, dst, lossless=True, near_lossless=o["near_lossless"],
                          method=o["method"], effort=o["effort"], passthrough=direct)
            if o["allow_lossy"]:
                lossy = encode_bytes(img, lossless=False, quality=o["quality"],
                                     method=o["method"], passthrough=direct)
                if lossy < size:
                    size = encode(img, dst, lossless=False, quality=o["quality"],
                                  method=o["method"], passthrough=direct)
    except Exception as exc:  # noqa: BLE001 - one bad page must not stop the batch
        return src, f"error: {exc}", 0, 0

    before = src.stat().st_size
    # A WebP bigger than the PNG is not worth keeping -- common on dense tone.
    if size >= before and not o["keep_larger"]:
        dst.unlink(missing_ok=True)
        return src, "kept-png", before, before
    if o["dry_run"]:
        dst.unlink(missing_ok=True)
    elif o["delete_original"]:
        src.unlink()
    return src, "ok", before, size


VARIANTS = [
    ("WebP lossless",         dict(lossless=True)),
    ("WebP near-lossless 60", dict(lossless=True, near_lossless=60)),
    ("WebP near-lossless 40", dict(lossless=True, near_lossless=40)),
    ("WebP lossy q90",        dict(lossless=False, quality=90)),
    ("WebP lossy q85",        dict(lossless=False, quality=85)),
    ("WebP lossy q80",        dict(lossless=False, quality=80)),
]


def measure(task):
    """Encode one page every which way. Runs in a worker process."""
    f, gray, effort = task
    with Image.open(f) as raw:
        raw.load()
        was_gray = (gray == "auto" and raw.mode in ("RGB", "RGBA")
                    and is_truly_grayscale(raw))
        img, unchanged = prepare(raw, gray)
        direct = f if unchanged else None
        sizes = {name: encode_bytes(img, effort=effort, passthrough=direct, **kw)
                 for name, kw in VARIANTS}
    return f.stat().st_size, was_gray, sizes


def benchmark(files, n, gray, effort, jobs):
    """Encode a random sample every which way and print what actually wins."""
    sample = random.sample(files, min(n, len(files)))
    print(f"Benchmarking {len(sample)} of {len(files)} pages "
          f"({'cwebp' if CWEBP else 'Pillow'})...\n")

    totals = {name: 0 for name, _ in VARIANTS}
    orig = gray_hits = 0
    with ProcessPoolExecutor(max_workers=jobs) as pool:
        for i, (size, was_gray, sizes) in enumerate(
            pool.map(measure, ((f, gray, effort) for f in sample)), 1
        ):
            orig += size
            gray_hits += was_gray
            for name, v in sizes.items():
                totals[name] += v
            print(f"  {i}/{len(sample)}", end="\r", flush=True)
    print(" " * 30, end="\r")
    print()

    print(f"{'setting':<26}{'total':>12}{'saved':>10}")
    print(f"{'source PNG':<26}{human(orig):>12}{'--':>10}")
    for name, _ in VARIANTS:
        t = totals[name]
        print(f"{name:<26}{human(t):>12}{100 - 100 * t / orig:9.1f}%")

    if gray == "auto" and gray_hits:
        print(f"\n{gray_hits}/{len(sample)} pages were RGB holding grayscale "
              f"content and were losslessly reduced to 8-bit gray.")
    best = min(totals.items(), key=lambda kv: kv[1])
    print(f"\nbest: {best[0]}  ({100 - 100 * best[1] / orig:.1f}% smaller)")
    if best[0].startswith("WebP lossy"):
        print("Note: lossy won on size here, but it still smears screentone "
              "dots and rings around lettering. Check a page before committing.")
    scale = len(files) / len(sample)
    print(f"projected over all {len(files)} files: "
          f"{human(orig * scale)} -> {human(best[1] * scale)}")


def human(n):
    for unit in ("B", "KB", "MB", "GB"):
        if abs(n) < 1024 or unit == "GB":
            return f"{n:,.1f} {unit}"
        n /= 1024


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("root", type=Path, help="directory to scan (or a single .png)")
    p.add_argument("--benchmark", type=int, metavar="N", nargs="?", const=20,
                   help="measure N random pages across every setting and exit")
    p.add_argument("--gray", choices=("auto", "force", "never"), default="auto",
                   help="auto: drop to 8-bit gray only when the RGB data is "
                        "already colourless (lossless); force: always; "
                        "never: leave alone (default: auto)")
    p.add_argument("--near-lossless", type=int, metavar="N",
                   help="0-100 edge-preserving preprocess before lossless; "
                        "lower is smaller and less exact (60 is a safe start)")
    p.add_argument("--allow-lossy", action="store_true",
                   help="also try lossy and keep it if smaller -- off by "
                        "default because it wrecks screentone")
    p.add_argument("-q", "--quality", type=int, default=85, help="lossy quality (default: 85)")
    p.add_argument("-m", "--method", type=int, default=6, choices=range(7),
                   help="lossy encoder effort 0-6 (default: 6)")
    p.add_argument("-z", "--effort", type=int, default=7, choices=range(10),
                   help="lossless encoder effort 0-9; 9 costs ~15x the time of "
                        "7 for about 1%% more saving (default: 7)")
    p.add_argument("-j", "--jobs", type=int, default=os.cpu_count(), help="parallel workers")
    p.add_argument("--no-recursive", action="store_true", help="do not descend into subdirectories")
    p.add_argument("--dry-run", action="store_true", help="report savings without writing")
    p.add_argument("--delete-original", action="store_true", help="remove each PNG once converted")
    p.add_argument("--overwrite", action="store_true", help="re-encode even if the .webp exists")
    p.add_argument("--keep-larger", action="store_true", help="keep the WebP even when it is bigger")
    args = p.parse_args()

    if args.root.is_file():
        files = [args.root]
    else:
        files = sorted(f for f in args.root.glob("*.png" if args.no_recursive else "**/*.png")
                       if f.is_file())
    if not files:
        sys.exit(f"No PNG files found under {args.root}")

    if args.benchmark:
        benchmark(files, args.benchmark, args.gray, args.effort, args.jobs)
        return

    o = {
        "gray": args.gray,
        "near_lossless": args.near_lossless,
        "allow_lossy": args.allow_lossy,
        "quality": args.quality,
        "method": args.method,
        "effort": args.effort,
        "dry_run": args.dry_run,
        "delete_original": args.delete_original and not args.dry_run,
        "overwrite": args.overwrite,
        "keep_larger": args.keep_larger,
    }
    print(f"{len(files)} pages | gray={args.gray} "
          f"{'lossless+lossy' if args.allow_lossy else 'lossless'} "
          f"| jobs={args.jobs}{' | DRY RUN' if args.dry_run else ''}")

    before = after = done = kept = 0
    problems = []
    with ProcessPoolExecutor(max_workers=args.jobs) as pool:
        for i, (src, status, b, a) in enumerate(
            pool.map(convert, ((f, o) for f in files), chunksize=4), 1
        ):
            if status in ("ok", "kept-png"):
                before += b
                after += a
                done += status == "ok"
                kept += status == "kept-png"
            elif status != "skipped":
                problems.append((src, status))
            if i % 25 == 0 or i == len(files):
                print(f"  {i}/{len(files)}", end="\r", flush=True)

    print(" " * 40, end="\r")
    print()
    saved = before - after
    print(f"converted : {done}")
    if kept:
        print(f"kept PNG  : {kept} (WebP came out larger)")
    print(f"before    : {human(before)}")
    print(f"after     : {human(after)}")
    print(f"saved     : {human(saved)}  ({100 * saved / before if before else 0:.1f}%)")
    if problems:
        print(f"\n{len(problems)} failed:")
        for src, status in problems[:20]:
            print(f"  {src}: {status}")
        if len(problems) > 20:
            print(f"  ... and {len(problems) - 20} more")


if __name__ == "__main__":
    main()
