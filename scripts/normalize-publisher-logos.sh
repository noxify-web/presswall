#!/usr/bin/env bash
# Trim transparent padding and normalize bundled publisher logos to a uniform ink height.
#
# Prefers the Rust tool (tools/trim-logos) for accurate alpha-bbox cropping.
# Falls back to ImageMagick if cargo is unavailable.
#
# Usage: ./scripts/normalize-publisher-logos.sh [target_ink_height]

set -euo pipefail

TARGET_HEIGHT="${1:-120}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOGO_DIR="$ROOT/public/publishers/logos"
FUZZ="2%"

if command -v cargo >/dev/null 2>&1; then
  exec bash "$ROOT/scripts/trim-logo-padding.sh" --apply --height "$TARGET_HEIGHT" "$LOGO_DIR"
fi

echo "cargo not found; falling back to ImageMagick trim…" >&2

if ! command -v magick >/dev/null 2>&1; then
  echo "error: need cargo or ImageMagick (magick)" >&2
  exit 1
fi

normalize_logo() {
  local src="$1"
  local dest="$2"

  magick "$src" -alpha on \
    -bordercolor none -border 1 \
    -fuzz "$FUZZ" -trim +repage \
    -resize "x${TARGET_HEIGHT}" \
    PNG32:"$dest"

  echo "Wrote $(basename "$dest") ($(magick identify -format '%wx%h' "$dest"))"
}

for logo in "$LOGO_DIR"/*.png; do
  [[ -f "$logo" ]] || continue
  tmp="${logo}.tmp"
  normalize_logo "$logo" "$tmp"
  mv "$tmp" "$logo"
done

echo "Normalized logos in $LOGO_DIR to ink height ${TARGET_HEIGHT}px"
