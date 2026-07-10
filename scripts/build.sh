#!/usr/bin/env bash
# Zips the extension into dist/wa-web-sidebar-toggle-v<version>.zip, reading the
# version straight from manifest.json so the artifact name can never drift
# out of sync with what's actually inside it.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VERSION=$(node -p "require('./manifest.json').version")
OUT_DIR="dist"
OUT_FILE="$OUT_DIR/wa-web-sidebar-toggle-v$VERSION.zip"

mkdir -p "$OUT_DIR"
rm -f "$OUT_FILE"

zip -r "$OUT_FILE" manifest.json src icons -x "*.DS_Store"

echo "Built $OUT_FILE"
