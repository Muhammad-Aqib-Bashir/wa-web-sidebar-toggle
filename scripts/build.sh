#!/usr/bin/env bash
# Produces dist/wa-sidebar-toggle-v<version>.zip and syncs icons into docs/
# so GitHub Pages can serve them as favicons and logo images.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VERSION=$(node -p "require('./manifest.json').version")
OUT_DIR="dist"
OUT_FILE="$OUT_DIR/wa-sidebar-toggle-v$VERSION.zip"

# Sync icons → docs/icons/ (single source of truth stays at icons/).
# GitHub Pages serves /docs as root, so docs/icons/ is what the website
# references. The extension itself reads from icons/ via manifest.json.
echo "Syncing icons → docs/icons/"
mkdir -p docs/icons
cp icons/icon16.png  docs/icons/
cp icons/icon48.png  docs/icons/
cp icons/icon128.png docs/icons/

mkdir -p "$OUT_DIR"
rm -f "$OUT_FILE"

zip -r "$OUT_FILE" \
  manifest.json \
  background.js \
  src \
  popup \
  welcome \
  icons \
  -x "*.DS_Store" "*.map"

echo "Built $OUT_FILE ($(du -sh "$OUT_FILE" | cut -f1))"
