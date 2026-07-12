# Shopify: never leave merchants on a tunnel

**Always-on Presswall rule.** Do not re-research — follow this.

## Safe resting state

- App host: `https://presswall.noxify.io` only (`shopify.app.prod.toml`)
- No store-level `shopify app dev` preview active

## Hard rules (enforced in repo)

1. **`shopify.app.toml` → `automatically_update_urls_on_dev = false`**  
   Never set this to `true`. True rewrites Partner Application URL for *all* installs to the tunnel.
2. **Develop only via `bun run dev:shopify`** (`scripts/shopify-app-dev.sh`)  
   - Refuses to start if auto-update is true  
   - On exit (Ctrl+C / stop), always runs `shopify app dev clean` on the dev store  
3. **Never** bare `shopify app dev` without cleaning after  
4. **Never** put permanent prod URLs in `shopify.app.toml` (breaks local OAuth)

## Two failure modes (if rules are broken)

1. **Partner app URLs** on tunnel → all installs break when tunnel dies → `bun run shopify:restore-urls`
2. **Store dev preview** left on → dev store only → `bun run shopify:dev-clean`

Hard refresh does **not** fix either. VPS deploy does **not** fix either.

## “Server Not Found” / trycloudflare / ngrok

```bash
bun run shopify:end-dev   # dev-clean + restore-urls
```

## Shipping to merchants

```bash
bun run shopify:deploy:prod   # always -c prod
```

Full procedure: skill `presswall-shopify-urls` and `AGENTS.md` → Protect live merchants.
