# Presswall

Shopify app for **"As seen on"** press and media logo strips on your storefront.

Built on the [shopify-nextjs-template](https://github.com/niiithish/shopify-nextjs-template) with **shadcn/ui** for the admin experience.

## Features

- Curated publisher library (90+ outlets) with quick search and category filters
- Logo guidance recommending transparent PNG/SVG assets for custom outlets
- Custom outlet support (name + optional SVG logo)
- Fully customizable heading text (show, hide, or rewrite)
- Style controls: mono, muted, or full-color logos
- Layouts: horizontal bar, grid, or scrolling marquee
- Live light/dark preview in admin
- Theme app extension block for the Online Store

## Prerequisites

- [Bun](https://bun.sh)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)

## Getting started

```bash
bun install
cp .env.example .env.local   # add Shopify API credentials
bun run db:push
shopify app dev
```

## Database (Turso)

Set Turso credentials in `.env.local`:

```bash
TURSO_DATABASE_URL=libsql://your-database-name-org.turso.io
TURSO_AUTH_TOKEN=your-token
```

Create a database with the [Turso CLI](https://docs.turso.tech/cli), then push the schema:

```bash
bun run db:push
bun run db:studio
```

Without Turso env vars, the app falls back to a local `file:data/dev.db` SQLite file for development.

## Theme block

After saving in the app admin:

1. Online Store → Customize
2. Add block → Apps → **Presswall**
3. Place on homepage, product page, or any section

## Legal note

Merchants are responsible for only displaying outlets they have been featured in. Presswall does not verify claims; usage is covered by your app terms.

## Linting

```bash
bun run lint
bun run format
```