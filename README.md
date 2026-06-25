# Relay — Shopify + Next.js starter

A minimal Next.js app with shadcn/ui, Shopify CLI config, and Drizzle ORM pre-wired for when you need a database.

Auth routes and Shopify SDK integration are not implemented yet — add those when you start building app features.

## Prerequisites

- [Bun](https://bun.sh) (used for package management and the SQLite driver via `bun:sqlite`)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)

## Getting started

```bash
bun install
cp .env.example .env.local   # fill in your Shopify credentials
bun run dev
```

Run with Shopify CLI:

```bash
shopify app dev
```

## Database

Drizzle is set up with a `Session` table stub (useful for Shopify session storage later, or anything else you need).

```bash
bun run db:push      # apply schema to data/dev.db
bun run db:studio    # open Drizzle Studio
```

The SQLite file lives at `data/dev.db` (override with `DATABASE_URL` in `.env.local`).

> **Note:** The DB client uses `bun:sqlite`. If you deploy on Node instead of Bun, swap the driver in `src/db/index.ts` when you start using the database.

## Linting & formatting

This project uses [Ultracite](https://www.ultracite.ai) with [Biome](https://biomejs.dev).

```bash
bun run lint      # check for issues
bun run format    # auto-fix and format
```

Install the [Biome VS Code extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) for format-on-save (`.vscode/settings.json` is already configured).

## Adding components

```bash
bunx shadcn@latest add button
```

Components are placed in the `components` directory.

```tsx
import { Button } from "@/components/ui/button";
```