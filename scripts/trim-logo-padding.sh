#!/usr/bin/env bash
# Trim excess transparent / junk padding from publisher logos (Rust tool).
#
# Finds the tight dark-ink bounding box, drops light gray fringe, forces pure
# black silhouettes, crops, and normalizes ink height.
#
# Usage:
#   ./scripts/trim-logo-padding.sh                  # dry-run report
#   ./scripts/trim-logo-padding.sh --apply          # write in place
#   ./scripts/trim-logo-padding.sh --apply --height 120
#   ./scripts/trim-logo-padding.sh --apply /path/to/logos
#
# Requires: cargo / rustc (see tools/trim-logos)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOL_DIR="$ROOT/tools/trim-logos"
DEFAULT_LOGOS="$ROOT/public/publishers/logos"

APPLY=0
HEIGHT=120
ALPHA=16
MAX_LUMA=200
INPUT=""
EXTRA=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply|-a)
      APPLY=1
      shift
      ;;
    --height)
      HEIGHT="${2:?--height needs a value}"
      shift 2
      ;;
    --alpha)
      ALPHA="${2:?--alpha needs a value}"
      shift 2
      ;;
    --max-luminance)
      MAX_LUMA="${2:?--max-luminance needs a value}"
      shift 2
      ;;
    --help|-h)
      sed -n '2,14p' "$0"
      exit 0
      ;;
    --)
      shift
      EXTRA+=("$@")
      break
      ;;
    -*)
      EXTRA+=("$1")
      shift
      ;;
    *)
      INPUT="$1"
      shift
      ;;
  esac
done

INPUT="${INPUT:-$DEFAULT_LOGOS}"

if ! command -v cargo >/dev/null 2>&1; then
  echo "error: cargo not found. Install Rust from https://rustup.rs" >&2
  exit 1
fi

ARGS=(
  --manifest-path "$TOOL_DIR/Cargo.toml"
  --release
  --
  --input "$INPUT"
  --alpha-threshold "$ALPHA"
  --max-luminance "$MAX_LUMA"
  --target-height "$HEIGHT"
)

if [[ "$APPLY" -eq 1 ]]; then
  ARGS+=(--in-place)
else
  ARGS+=(--dry-run)
fi

ARGS+=("${EXTRA[@]+"${EXTRA[@]}"}")

echo "Building trim-logos (release)…"
cargo run "${ARGS[@]}"
