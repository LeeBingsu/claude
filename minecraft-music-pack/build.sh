#!/usr/bin/env bash
# Rebuild pack.png + sounds.json, validate, and zip the pack into dist/.
set -euo pipefail
cd "$(dirname "$0")"
NAME="Endfield BGM.zip"

./tools/make_icon.sh
python3 tools/generate_sounds.py
python3 tools/validate.py

mkdir -p dist
rm -f "dist/$NAME"
( cd pack && zip -r -q -X "../dist/$NAME" pack.mcmeta pack.png assets )
echo "built dist/$NAME ($(du -h "dist/$NAME" | cut -f1))"
