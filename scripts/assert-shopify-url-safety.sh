#!/usr/bin/env bash
# Fail if Shopify app configs can rewrite merchants onto a tunnel.
# Used by CI and `bun run check:shopify-urls`. No Shopify CLI / network required.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PROD_HOST="presswall.noxify.io"
errors=0

fail() {
  echo "error: $*" >&2
  errors=$((errors + 1))
}

ok() {
  echo "ok: $*"
}

# --- shopify.app.toml (local dev) ---
if [[ ! -f shopify.app.toml ]]; then
  fail "shopify.app.toml missing"
else
  if ! grep -qE '^\s*automatically_update_urls_on_dev\s*=\s*false\s*$' shopify.app.toml; then
    fail "shopify.app.toml must set automatically_update_urls_on_dev = false (never true)"
  else
    ok "shopify.app.toml auto-update is false"
  fi

  # Application URL may be a tunnel placeholder for local OAuth — that is fine.
  # What must never happen is auto-update rewriting Partner URLs for all installs.
  if grep -qiE '^\s*automatically_update_urls_on_dev\s*=\s*true\s*$' shopify.app.toml; then
    fail "shopify.app.toml has automatically_update_urls_on_dev = true (breaks all merchants)"
  fi
fi

# --- shopify.app.prod.toml (merchants) ---
if [[ ! -f shopify.app.prod.toml ]]; then
  fail "shopify.app.prod.toml missing"
else
  if ! grep -qE '^\s*automatically_update_urls_on_dev\s*=\s*false\s*$' shopify.app.prod.toml; then
    fail "shopify.app.prod.toml must set automatically_update_urls_on_dev = false"
  else
    ok "shopify.app.prod.toml auto-update is false"
  fi

  if ! grep -qE "^\s*application_url\s*=\s*\"https://${PROD_HOST}\"" shopify.app.prod.toml; then
    fail "shopify.app.prod.toml application_url must be https://${PROD_HOST}"
  else
    ok "shopify.app.prod.toml application_url is production"
  fi

  if ! grep -qE "url\s*=\s*\"https://${PROD_HOST}/api/proxy\"" shopify.app.prod.toml; then
    fail "shopify.app.prod.toml app_proxy.url must be https://${PROD_HOST}/api/proxy"
  else
    ok "shopify.app.prod.toml app proxy is production"
  fi

  if ! grep -qE "https://${PROD_HOST}/api/auth/callback" shopify.app.prod.toml; then
    fail "shopify.app.prod.toml redirect_urls must include https://${PROD_HOST}/api/auth/callback"
  else
    ok "shopify.app.prod.toml auth callback is production"
  fi

  # Prod config must never list a tunnel host.
  if grep -qiE 'ngrok|trycloudflare|cloudflare\.com|loca\.lt|localhost' shopify.app.prod.toml; then
    fail "shopify.app.prod.toml must not contain tunnel/localhost hosts"
  else
    ok "shopify.app.prod.toml has no tunnel hosts"
  fi
fi

# --- package scripts must keep safe paths ---
if [[ -f package.json ]]; then
  if ! grep -q 'shopify:end-dev' package.json; then
    fail "package.json missing shopify:end-dev recovery script"
  else
    ok "package.json has shopify:end-dev"
  fi
  if ! grep -q 'shopify app deploy -c prod' package.json; then
    fail "package.json must deploy with -c prod"
  else
    ok "package.json deploys with -c prod"
  fi
fi

if [[ "$errors" -gt 0 ]]; then
  echo ""
  echo "Shopify URL safety check failed ($errors). See AGENTS.md → Protect live merchants."
  exit 1
fi

echo ""
echo "Shopify URL safety check passed."
