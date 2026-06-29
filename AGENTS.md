# Presswall — agent notes

Shopify embedded app (Next.js App Router) for merchant “as seen on” press logo strips. Storefront data is served via **app proxy**; the Online Store block lives in `extensions/presswall-theme/`.

## Setup & run

- Package manager: **Bun** (`bun install`).
- Copy `.env.example` → `.env.local` (Shopify API key/secret; optional Turso vars).
- Push DB schema before first run: `bun run db:push`.
- **Full dev loop** (tunnel, OAuth, extension): `shopify app dev` — not `bun run dev` alone. `shopify.web.toml` wires Shopify CLI to `bun run dev` / `bun run build` on port 3000.
- Do **not** hardcode `SHOPIFY_APP_URL` during dev; CLI sets it (`automatically_update_urls_on_dev` in `shopify.app.toml`).

## Verify changes

```bash
bun run lint        # ultracite check (Biome)
bun run typecheck   # tsc --noEmit
bun run test        # bun:test — unit tests in lib/*.test.ts
```

Run a single test file: `bun test lib/presswall-marquee.test.ts` (or `--test-name-pattern "..."`).

Use `bun run format` (`ultracite fix`) before commit if you touched formatting/lint issues.

## Layout (where to edit)

| Area | Path |
|------|------|
| Admin UI (embedded) | `app/page.tsx`, `components/presswall/`, `hooks/use-presswall-editor.ts` |
| API routes | `app/api/` — `presswall`, `publishers`, `custom-templates`, `proxy/config`, `auth`, `webhooks`, `theme-activation` |
| Shopify session / auth | `lib/authenticate-*.ts`, `lib/session-storage.ts`, `lib/shopify.ts` |
| Business logic | `lib/presswall-service.ts`, `lib/custom-template-service.ts`, `lib/resolve-storefront-publishers.ts`, `lib/publishers-seed.ts` |
| DB (Drizzle) | `src/db/schema.ts`, `src/db/index.ts`, `src/db/constants.ts`; migrations in `drizzle/` |
| Bundled outlet logos | `public/publishers/logos/`, catalog in `lib/bundled-publishers.ts` |
| Theme app extension | `extensions/presswall-theme/` |

Path alias: `@/*` → repo root (`tsconfig.json`).

## Database

- **Turso** when `TURSO_DATABASE_URL` (+ token) are set; otherwise local SQLite `file:data/dev.db`.
- `drizzle.config.ts` uses the same `getTursoConfig()` as runtime — env must be loaded for `db:push` / `db:studio` / `db:generate`.
- `db:push` is two-phase: `bun run db:apply-pending` runs the hand-written, idempotent ALTER list in `scripts/apply-pending-migrations.ts` (ignores "duplicate column"/"already exists" errors), then `drizzle-kit push` syncs the schema. Keep new additive column changes in that script until next schema reset.
- `bun run db:reset-onboarding <shop.myshopify.com>` clears a shop's onboarding flag to re-trigger the admin flow.
- Publisher catalog is **seeded on first authenticated admin page load** (`ensurePublisherCatalogSeeded` in `app/page.tsx`), not via a separate seed script.

## Shopify specifics

- Scopes: `write_app_proxy`, `read_themes` (`shopify.app.toml` / `.env.example`).
- App proxy: storefront calls under `apps/presswall` → `app/api/proxy/`.
- Webhook: `app/uninstalled` → `app/api/webhooks/route.ts`.
- When changing app URLs, auth, or store-facing GraphQL, prefer Shopify skills/CLI docs over guessing.

## Assets & scripts

- Bulk logo prep (ImageMagick): `scripts/process-publisher-logos.sh /path/to/sources` → writes silhouettes to `public/publishers/logos/`.
- Custom merchant SVGs: sanitized in `lib/svg-sanitize.ts`; `components/presswall/svg-logo.tsx` uses `dangerouslySetInnerHTML` — Biome rule is explicitly off in `biome.jsonc` for that file only.

## Linting

Ultracite/Biome preset (`biome.jsonc` extends `ultracite/biome/*`). Repo-specific override: only `svg-logo.tsx` for `noDangerouslySetInnerHtml`.
