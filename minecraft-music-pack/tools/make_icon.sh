#!/usr/bin/env bash
# Convert the album-art source image into pack.png (square 128x128 PNG, as Minecraft expects).
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg -y -loglevel error -i assets-src/pack_icon.jpg \
  -vf "scale=128:128:force_original_aspect_ratio=increase,crop=128:128" \
  -pix_fmt rgb24 pack/pack.png
echo "wrote pack/pack.png"
