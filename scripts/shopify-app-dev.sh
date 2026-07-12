#!/usr/bin/env bash
# Safe local Shopify dev for Presswall.
#
# Hard guarantees:
# 1) shopify.app.toml has automatically_update_urls_on_dev = false → Partner
#    Application URL / redirects / app proxy stay on the last *prod* release
#    (presswall.noxify.io). Merchants are never rewritten to a tunnel.
# 2) On exit (Ctrl+C, crash, or normal stop) we always clear the *store*
#    dev preview so noxify-dvgwvtrt is not left on a dead tunnel.
#
# Prefer: bun run dev:shopify
# Do not run bare `shopify app dev` unless you will clean the store yourself.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DEV_STORE="${PRESSWALL_DEV_STORE:-noxify-dvgwvtrt.myshopify.com}"
# Stable ngrok hostname; local port matches shopify.web.toml (3001).
TUNNEL_URL="${PRESSWALL_TUNNEL_URL:-https://reissue-irritable-slider.ngrok-free.dev:3001}"

cleaned=0
cleanup() {
  if [[ "$cleaned" -eq 1 ]]; then
    return
  fi
  cleaned=1
  echo ""
  echo "==> Clearing store dev preview on ${DEV_STORE}..."
  if ! shopify app dev clean -c prod -s "$DEV_STORE"; then
    echo "warning: shopify app dev clean failed — run: bun run shopify:dev-clean" >&2
  else
    echo "==> Dev preview cleared. Store uses released prod app (presswall.noxify.io) again."
  fi
}

trap cleanup EXIT INT TERM HUP

if ! grep -qE '^\s*automatically_update_urls_on_dev\s*=\s*false\s*$' shopify.app.toml; then
  echo "error: shopify.app.toml must have automatically_update_urls_on_dev = false" >&2
  echo "       (rewriting Partner URLs during dev breaks all merchants when the tunnel dies)." >&2
  exit 1
fi

echo "Presswall safe dev"
echo "  Partner app URLs: never updated by this session (auto-update OFF)"
echo "  Store preview:    ${DEV_STORE} → local tunnel while running"
echo "  On exit:          auto shopify:dev-clean"
echo "  Tunnel:           ${TUNNEL_URL}"
echo ""

# Do not exec — shell must stay alive so trap runs after CLI exits.
set +e
shopify app dev --tunnel-url="${TUNNEL_URL}" "$@"
code=$?
set -e
exit "$code"
