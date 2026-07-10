# Shopify: never leave merchants on a tunnel

**Always-on Presswall rule.** Do not re-research — follow this.

## Safe resting state

- App host: `https://presswall.noxify.io` only (`shopify.app.prod.toml`)
- No store-level `shopify app dev` preview active

## Two failure modes (both real)

1. **Partner app URLs** rewritten to `*.trycloudflare.com` / ngrok by `shopify app dev` → all installs break when tunnel dies.
2. **Store dev preview** pins the tunnel on the dev store → survives `shopify app deploy -c prod` until cleaned.

Hard refresh does **not** fix either.

## After any `shopify app dev` / when user says “stop developing” / “Server Not Found”

```bash
bun run shopify:dev-clean
bun run shopify:restore-urls
```

## Shipping to merchants

```bash
bun run shopify:deploy:prod   # always -c prod
```

Never put prod URLs permanently in `shopify.app.toml`.  
VPS/container deploy does **not** fix Partner URLs or store previews.

Full procedure: skill `presswall-shopify-urls` and `AGENTS.md` → Protect live merchants.
