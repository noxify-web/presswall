# Shopify dev vs prod URLs (Presswall)

Canonical rules: `/AGENTS.md` → **Protect live merchants**.

## Why “Server Not Found” on trycloudflare happens

`shopify app dev` does two things:

1. May rewrite **Partner app URLs** to the tunnel (all installs).
2. Always pins a **dev preview on the development store** that keeps using the tunnel until cleared.

`shopify app deploy -c prod` fixes (1) but **not** (2). Hard refresh does nothing.

## Safe resting state (not developing)

```bash
bun run shopify:dev-clean
bun run shopify:restore-urls
```

Active host must be `https://presswall.noxify.io`.

## Developing

```bash
bun run dev:shopify
# or: shopify app dev
```

When finished → end-of-dev checklist above.

## Shipping extensions/config to merchants

```bash
bun run shopify:deploy:prod
```

Never deploy production intent with only default `shopify.app.toml`.
