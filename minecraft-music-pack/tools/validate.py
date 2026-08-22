"""Sanity-check the built pack: valid JSON, every referenced sound file present and a real Ogg Vorbis stream."""
import json
import os
import subprocess
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "pack"))
SOUNDS_DIR = os.path.join(ROOT, "assets", "minecraft", "sounds")

errors = []

meta = json.load(open(os.path.join(ROOT, "pack.mcmeta"), encoding="utf-8"))["pack"]
if not isinstance(meta.get("min_format"), int) or not isinstance(meta.get("max_format"), int):
    errors.append("pack.mcmeta: min_format/max_format must be integers")

sounds = json.load(open(os.path.join(ROOT, "assets", "minecraft", "sounds.json"), encoding="utf-8"))
referenced = set()
for event, body in sounds.items():
    if not body.get("replace"):
        errors.append(f"{event}: missing \"replace\": true, vanilla tracks would still play")
    for entry in body["sounds"]:
        name = entry["name"] if isinstance(entry, str) else entry["name"]
        referenced.add(name)
        path = os.path.join(SOUNDS_DIR, *name.split("/")) + ".ogg"
        if not os.path.isfile(path):
            errors.append(f"{event}: missing file {path}")
            continue
        with open(path, "rb") as f:
            head = f.read(64)
        if head[:4] != b"OggS" or b"vorbis" not in head:
            errors.append(f"{name}: not an Ogg Vorbis stream")
        if not isinstance(entry, str) and not entry.get("stream"):
            errors.append(f"{event}/{name}: music entries should set \"stream\": true")

on_disk = {
    os.path.relpath(os.path.join(dp, f), SOUNDS_DIR)[: -len(".ogg")].replace(os.sep, "/")
    for dp, _, fs in os.walk(SOUNDS_DIR)
    for f in fs
    if f.endswith(".ogg")
}
for orphan in sorted(on_disk - referenced):
    errors.append(f"unused audio file: {orphan}.ogg")

# decode every track end-to-end if ffmpeg is around
if subprocess.run(["which", "ffmpeg"], capture_output=True).returncode == 0:
    for name in sorted(referenced):
        path = os.path.join(SOUNDS_DIR, *name.split("/")) + ".ogg"
        r = subprocess.run(
            ["ffmpeg", "-v", "error", "-i", path, "-f", "null", "-"], capture_output=True
        )
        if r.returncode != 0 or r.stderr.strip():
            errors.append(f"{name}: decode error {r.stderr.decode()[:200]}")

print(f"events: {len(sounds)}  tracks: {len(referenced)}  files: {len(on_disk)}")
if errors:
    print("\n".join("ERROR " + e for e in errors))
    sys.exit(1)
print("pack OK")
