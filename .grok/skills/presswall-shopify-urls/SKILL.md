---
name: presswall-shopify-urls
description: >
  Presswall Shopify dev vs production URL safety. Use when running shopify app dev,
  shopify app deploy, restoring prod URLs, shipping the app, ending a dev session,
  or fixing “Server Not Found” / trycloudflare / ngrok / tunnel / broken live app open.
  Also for /presswall-shopify-urls, shopify:restore-urls, shopify:dev-clean,
  protect live merchants, Partner Dashboard app URL, or dev preview stuck on tunnel.
---

# Presswall Shopify URLs (no research needed)

Self-contained. Do **not** web-search unless Shopify CLI itself fails with a new error.

## Facts (stable)

| Item | Value |
|------|--------|
| Production host | `https://presswall.noxify.io` |
| Dev store | `noxify-dvgwvtrt.myshopify.com` |
| Dev config | `shopify.app.toml` — tunnel placeholders, **`automatically_update_urls_on_dev = false`** |
| Prod config | `shopify.app.prod.toml` (absolute prod URLs + app proxy) |
| Safe dev entry | `bun run dev:shopify` → `scripts/shopify-app-dev.sh` |
| Partner app | Single app — released URLs must stay prod |

## Hard rules (do not weaken)

1. **`automatically_update_urls_on_dev` must stay `false` in `shopify.app.toml`.**  
   When true, `shopify app dev` rewrites Partner Application URL / redirects / app proxy to the tunnel for **every** install. That is how “all merchants die when the tunnel dies.”
2. **Develop only with `bun run dev:shopify`.** The wrapper:
   - Aborts if auto-update is true
   - Always runs `shopify app dev clean` on exit so the **dev store** is not left on a dead tunnel
3. Ship merchant-facing config only with **`-c prod`** / `bun run shopify:deploy:prod`.
4. VPS/container deploy does **not** change Partner URLs or store previews.

## What still happens during a good dev session

| Layer | During `bun run dev:shopify` | After clean exit |
|-------|------------------------------|------------------|
| Partner / all merchants | Stay on `presswall.noxify.io` (last prod release) | Unchanged |
| Dev store only | Store **dev preview** → local tunnel | Cleared → prod again |

So you can develop freely; only the **dev store** uses the tunnel while the session is alive. Merchants are not rewritten.

## Two failure modes (if someone skips the wrapper / flips the flag)

| Layer | Cause | Fix |
|-------|--------|-----|
| A. Released Partner config | `automatically_update_urls_on_dev = true` or bad deploy without `-c prod` | `bun run shopify:restore-urls` |
| B. Store dev preview | Session ended without clean (bare `shopify app dev`, kill -9, crash before trap) | `bun run shopify:dev-clean` |

**Hard refresh never fixes A or B.**  
**Deploy alone never fixes B.**

## Decision tree

### User opening live app → “Server Not Found” / Zen / trycloudflare / ngrok

```bash
bun run shopify:end-dev
# same as: shopify:dev-clean && shopify:restore-urls
```

Then reopen the admin app URL. If still broken: `curl -sI https://presswall.noxify.io` is 200; reinstall on that store only as last resort.

### Starting local development

```bash
bun run dev:shopify
# NOT bare: shopify app dev
```

Ctrl+C is fine — wrapper cleans the store preview.

### Ending development (if you used bare CLI or kill -9)

```bash
bun run shopify:end-dev
```

### Shipping extension or app config to merchants

```bash
bun run shopify:deploy:prod
```

Always **`-c prod`**. Never deploy merchant-facing config from default `shopify.app.toml` alone.

### VPS / Docker only

`bun run deploy:aws:update` updates EC2 only. Tunnel symptoms → this skill’s checklist, not only container redeploy.

## Forbidden

- Setting `automatically_update_urls_on_dev = true`
- Bare `shopify app dev` without cleanup after
- Leaving Partner URLs on a dead tunnel
- Pointing `shopify.app.toml` at `presswall.noxify.io` permanently
- Claiming “hard refresh” will fix store dev preview
- Re-researching trycloudflare before running `shopify:end-dev`

## Package scripts

| Script | Effect |
|--------|--------|
| `dev:shopify` | Safe wrap: auto-update guard + `shopify app dev` + clean on exit |
| `shopify:dev-clean` | Clear store tunnel preview |
| `shopify:restore-urls` | Re-release prod Partner URLs |
| `shopify:end-dev` | Both clean + restore (emergency / bare CLI recovery) |
| `shopify:deploy:prod` | Ship prod config + extensions |

## Related

- `.grok/rules/shopify-dev-prod-urls.md`
- `AGENTS.md` → Protect live merchants
- `scripts/shopify-app-dev.sh`
