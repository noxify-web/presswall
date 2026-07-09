#!/usr/bin/env bash
# Build color / pure-black / pure-white logo variants from a source PNG.
#
# Usage:
#   ./scripts/process-publisher-logo-variants.sh /path/to/source.png outlet-id
#   ./scripts/process-publisher-logo-variants.sh /path/to/sources-dir
#
# Writes:
#   public/publishers/logos/{id}/color.png
#   public/publishers/logos/{id}/black.png
#   public/publishers/logos/{id}/white.png
#
# Black and white share the same alpha mask (pure #000 / #fff ink).

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

  # Shape: clean alpha + trim + normalize height (preserve RGB).
  # Use +clone in-stack compose (mpr write/delete path can zero alpha incorrectly).
  # +compose after CopyOpacity is required — otherwise trim/resize keep
  # composing and can zero RGB into solid black bars.
  magick "$src" -resize '1600x600>' -alpha on -colorspace sRGB \
    \( +clone -alpha extract -threshold "$ALPHA_THRESH" \) \
    -compose CopyOpacity -composite +compose \
    -alpha on -bordercolor none -border 2 \
    -fuzz "$TRIM_FUZZ" -trim +repage \
    -resize "x${INK_HEIGHT}" \
    PNG32:"$work/shaped.png"

  magick "$work/shaped.png" PNG32:"$dest_dir/color.png"

  # Black: pure #000 + alpha from shaped (mpr:a +delete so colorize hits RGB only)
  magick "$work/shaped.png" \
    \( +clone -alpha extract -write mpr:a +delete \) \
    -alpha off -fill black -colorize 100 \
    mpr:a -compose CopyOpacity -composite +compose \
    PNG32:"$dest_dir/black.png"

  # White: pure #fff + same alpha
  magick "$work/shaped.png" \
    \( +clone -alpha extract -write mpr:a +delete \) \
    -alpha off -fill white -colorize 100 \
    mpr:a -compose CopyOpacity -composite +compose \
    PNG32:"$dest_dir/white.png"

  local dims alpha_mean
  dims="$(magick identify -format '%wx%h' "$dest_dir/black.png")"
  alpha_mean="$(magick "$dest_dir/black.png" -alpha extract -format '%[fx:mean]' info:)"
  if awk "BEGIN { exit !($alpha_mean < 0.02 || $alpha_mean > 0.98) }"; then
    echo "WARN $id black alpha_mean=$alpha_mean (expect partial transparency)" >&2
  fi
  echo "OK $id → $dest_dir ({color,black,white}.png) $dims alpha_mean=$alpha_mean"
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
