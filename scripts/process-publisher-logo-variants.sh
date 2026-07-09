#!/usr/bin/env bash
# Build color / pure-black / pure-white logo variants from a source PNG.
#
# Usage:
#   ./scripts/process-publisher-logo-variants.sh /path/to/source.png outlet-id
#   ./scripts/process-publisher-logo-variants.sh /path/to/sources-dir   # uses basename as id
#
# Writes:
#   public/publishers/logos/{id}/color.png
#   public/publishers/logos/{id}/black.png
#   public/publishers/logos/{id}/white.png
#
# Black and white share the same alpha mask so mono strips have uniform ink intensity.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_ROOT="${TARGET_ROOT:-$ROOT/public/publishers/logos}"
INK_HEIGHT="${INK_HEIGHT:-120}"
TRIM_FUZZ="${TRIM_FUZZ:-2%}"
ALPHA_THRESH="${ALPHA_THRESH:-30%}"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <source.png|source-dir> [outlet-id]" >&2
  exit 1
fi

process_one() {
  local src="$1"
  local id="$2"
  local dest_dir="$TARGET_ROOT/$id"
  mkdir -p "$dest_dir"

  local work
  work="$(mktemp -d)"
  # shellcheck disable=SC2064
  trap "rm -rf '$work'" RETURN

  # Normalize: resize if huge, ensure alpha.
  magick "$src" -resize '1600x600>' -alpha on -colorspace sRGB \
    PNG32:"$work/base.png"

  # Alpha mask from opacity (drops near-transparent fringe).
  magick "$work/base.png" -alpha extract -threshold "$ALPHA_THRESH" \
    PNG32:"$work/mask.png"

  # Apply mask — must be a separate convert; chaining compose + trim in one
  # invocation can zero out RGB (ImageMagick compose state leak).
  magick "$work/base.png" "$work/mask.png" -compose CopyOpacity -composite \
    PNG32:"$work/masked.png"

  magick "$work/masked.png" -alpha on -bordercolor none -border 2 \
    -fuzz "$TRIM_FUZZ" -trim +repage \
    -resize "x${INK_HEIGHT}" \
    PNG32:"$work/color-raw.png"

  # Re-extract cleaned mask after trim+resize for pure mono colorize.
  magick "$work/color-raw.png" -alpha extract -threshold 10% \
    PNG32:"$work/mask2.png"

  # Color: keep RGB, cleaned alpha
  magick "$work/color-raw.png" "$work/mask2.png" -compose CopyOpacity -composite \
    PNG32:"$dest_dir/color.png"

  # Black: pure #000 + same mask
  magick "$work/color-raw.png" -alpha off -fill black -colorize 100 \
    "$work/mask2.png" -compose CopyOpacity -composite \
    PNG32:"$dest_dir/black.png"

  # White: pure #fff + same mask
  magick "$work/color-raw.png" -alpha off -fill white -colorize 100 \
    "$work/mask2.png" -compose CopyOpacity -composite \
    PNG32:"$dest_dir/white.png"

  local dims
  dims="$(magick identify -format '%wx%h' "$dest_dir/black.png")"
  echo "OK $id → $dest_dir ({color,black,white}.png) $dims"
}

SRC="$1"
ID_ARG="${2:-}"

if [[ -d "$SRC" ]]; then
  shopt -s nullglob
  for f in "$SRC"/*.{png,PNG,webp,jpg,jpeg,svg}; do
    base="$(basename "$f")"
    id="${base%.*}"
    id="$(echo "$id" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g; s/--*/-/g; s/^-//; s/-$//')"
    process_one "$f" "$id"
  done
elif [[ -f "$SRC" ]]; then
  if [[ -z "$ID_ARG" ]]; then
    base="$(basename "$SRC")"
    ID_ARG="${base%.*}"
  fi
  process_one "$SRC" "$ID_ARG"
else
  echo "Not found: $SRC" >&2
  exit 1
fi
