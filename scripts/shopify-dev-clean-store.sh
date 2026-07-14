#!/usr/bin/env bash
# Clear the development-store preview so it never stays on a dead tunnel.
# Safe to run anytime (idempotent). Used after prod deploys and by CI watchdog.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DEV_STORE="${PRESSWALL_DEV_STORE:-noxify-dvgwvtrt.myshopify.com}"

echo "==> Clearing store dev preview on ${DEV_STORE}..."
if shopify app dev clean -c prod -s "$DEV_STORE"; then
  echo "==> Store preview cleared (store uses released prod app)."
else
  echo "error: shopify app dev clean failed for ${DEV_STORE}" >&2
  exit 1
fi
