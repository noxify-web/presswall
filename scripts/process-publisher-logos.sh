#!/usr/bin/env bash
# Install publisher logos as color + pure black + pure white variants.
# Usage: ./scripts/process-publisher-logos.sh /path/to/source/dir
#
# Each source file named `{id}.png` (or mapped below) becomes:
#   public/publishers/logos/{id}/{color,black,white}.png
#
# Prefer: bun scripts/download-vhv-logos.ts  for bulk catalog refresh.

set -euo pipefail

SRC_DIR="${1:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VARIANT_SCRIPT="$ROOT/scripts/process-publisher-logo-variants.sh"

if [[ -z "$SRC_DIR" || ! -d "$SRC_DIR" ]]; then
  echo "Usage: $0 /path/to/source/logos" >&2
  exit 1
fi

shopt -s nullglob
for src in "$SRC_DIR"/*.{png,PNG,webp,jpg,jpeg}; do
  base="$(basename "$src")"
  id="${base%.*}"
  id="$(echo "$id" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g; s/--*/-/g; s/^-//; s/-$//')"
  bash "$VARIANT_SCRIPT" "$src" "$id"
done
