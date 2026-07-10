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
| Dev config | `shopify.app.toml` (tunnel, `automatically_update_urls_on_dev = true`) |
| Prod config | `shopify.app.prod.toml` (absolute prod URLs + app proxy) |
| Partner app | Single app (client id in both tomls) — one URL set at a time for released config |

## Two independent problems

| Layer | What `shopify app dev` does | Cleared by |
|-------|----------------------------|------------|
| A. Released Partner config | May rewrite Application URL / redirects / app proxy to tunnel | `bun run shopify:restore-urls` (= `shopify app deploy -c prod --allow-updates`) |
| B. Store dev preview | Pins tunnel on **that store** even after a good prod deploy | `bun run shopify:dev-clean` (= `shopify app dev clean -c prod -s noxify-dvgwvtrt.myshopify.com`) |

**Hard refresh never fixes A or B.**  
**Deploy alone never fixes B.**  
**Dev-clean alone may not fix A if Partner URLs were rewritten.**

## Decision tree

### User opening live app → “Server Not Found” / Zen / trycloudflare / ngrok

1. Run **both**:
   ```bash
   bun run shopify:dev-clean
   bun run shopify:restore-urls
   ```
2. Tell user to reopen admin app URL (one hard refresh OK after clean).
3. If still broken: confirm `curl -sI https://presswall.noxify.io` is 200; then reinstall app on that store only as last resort.

### Ending local development / “don’t affect users”

```bash
bun run shopify:dev-clean
bun run shopify:restore-urls
```

Do not leave the session without this (or explicitly hand the commands to the user).

### Shipping extension or app config to merchants

```bash
bun run shopify:deploy:prod
# shopify app deploy -c prod --allow-updates --message "…"
```

- Always **`-c prod`**. Never deploy merchant-facing config from default `shopify.app.toml` alone.
- Prefer one-shot `-c prod` over permanently `shopify app config use prod`.
- After deploy, if the **dev store** was recently on `shopify app dev`, still run `bun run shopify:dev-clean`.

### Starting local development

```bash
bun run dev:shopify
# or: shopify app dev
```

OK to use tunnel on dev store. Do **not** edit `shopify.app.toml` to permanent prod URLs.

### VPS / Docker only

`bun run deploy:aws:update` updates EC2 container only. It does **not** change Partner URLs or store previews. If the symptom is tunnel host in the browser, use this skill’s checklist, not only container redeploy.

## Forbidden

- Leaving Partner URLs on a dead tunnel after the session
- Pointing `shopify.app.toml` at `presswall.noxify.io` permanently
- Claiming “hard refresh” will fix store dev preview
- Re-researching trycloudflare + deploy forums before running the two scripts above

## Package scripts (source of truth in package.json)

| Script | Effect |
|--------|--------|
| `shopify:dev-clean` | Clear store tunnel preview |
| `shopify:restore-urls` | Re-release prod Partner URLs |
| `shopify:deploy:prod` | Ship prod config + extensions |

## Related always-on docs

- `.grok/rules/shopify-dev-prod-urls.md` (short rule, every session)
- `AGENTS.md` → **Protect live merchants**
