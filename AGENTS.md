# Presswall — agent notes

Shopify embedded app (Next.js App Router) for merchant “as seen on” press logo strips. Storefront data is served via **app proxy**; the Online Store block lives in `extensions/presswall-theme/`.

**Production URL:** `https://presswall.noxify.io` (domain: `noxify.io`, subdomain `presswall`).

**GitHub:** `https://github.com/niiithish/presswall` (`origin` remote). Intended org home: `noxify/presswall` — transfer requires noxify org admin approval.

## Setup & run (local dev)

- Package manager: **Bun** (`bun install`).
- Copy `.env.example` → `.env.local` (Shopify API key/secret; optional Turso vars).
- Push DB schema before first run: `bun run db:push`.
- **Full dev loop** (tunnel, OAuth, extension): `shopify app dev` — not `bun run dev` alone. `shopify.web.toml` wires Shopify CLI to `bun run dev` / `bun run build` on port 3000.
- Do **not** hardcode production URLs in the default Shopify config during dev; CLI updates tunnel URLs when `automatically_update_urls_on_dev = true` in `shopify.app.toml`.

## Dev vs prod Shopify config

| File | Purpose |
|------|---------|
| `shopify.app.toml` | **Local dev** — ngrok tunnel URLs, `automatically_update_urls_on_dev = true` |
| `shopify.app.prod.toml` | **Production** — `https://presswall.noxify.io`, absolute app-proxy URL |

**Deploy extension/app to production:**

```bash
shopify app config use prod
shopify app deploy --allow-updates
```

Revert to dev config after prod deploy: `shopify app config use default` (or whatever the dev config name is).

**Never** point `shopify.app.toml` at production permanently — it breaks `shopify app dev` OAuth/tunneling.

## Production hosting (AWS VPS)

Current stack (Debian 12 on EC2, not App Runner/ECS):

| Item | Value |
|------|-------|
| Domain | `presswall.noxify.io` → A record → Elastic IP |
| Elastic IP | `35.169.154.151` (set `VPS_IP` env for deploy scripts) |
| SSH | `ssh -i ~/.ssh/presswall-debian.pem admin@35.169.154.151` |
| Reverse proxy | Caddy (auto Let's Encrypt TLS) → `127.0.0.1:3000` |
| Container | ECR `186388117288.dkr.ecr.us-east-1.amazonaws.com/presswall:latest` |
| Swap | 2 GB `/swapfile` (persistent, `vm.swappiness=10`) — safety buffer for deploy/traffic spikes |
| Runtime secrets | AWS Secrets Manager (`presswall/shopify-api-key`, `shopify-api-secret`, `turso-*`) |
| Database | Turso libSQL (`presswall-noxify` in `us-east-1`) |

**Redeploy app container** (build locally, push ECR, restart on VPS):

```bash
# Requires .env.local with AWS creds; secrets fetched on VPS from Secrets Manager
VPS_IP=35.169.154.151 \
SHOPIFY_APP_URL=https://presswall.noxify.io \
SCOPES=write_app_proxy,read_themes \
bash scripts/update-vps-container.sh
# or: bun run deploy:aws:update  (with VPS_IP exported)
```

**Bootstrap new VPS** (first-time): `bun run deploy:aws:vps` — see `scripts/deploy-aws-ec2-debian.sh`.

**Important deploy rules:**

- `Dockerfile` does **not** bake in `SHOPIFY_API_SECRET` (or API key) — secrets are injected at `docker run` only.
- Container **must** have `SCOPES=write_app_proxy,read_themes` (both scopes). Missing `read_themes` breaks theme-activation checks and metafield sync (403).
- Copy `.env.production.example` for prod env var reference; use `.env.production.local` for local prod deploy vars (gitignored).

Infra scripts: `scripts/deploy-aws-ec2-debian.sh`, `scripts/update-vps-container.sh`, `scripts/deploy-aws-apprunner.sh` (blocked on some AWS accounts), `scripts/deploy-aws-ecs.sh` (unused). IAM template: `infra/presswall-deploy-iam-policy.json`.

## Auth & sessions (critical for production)

Shopify **no longer accepts non-expiring offline access tokens** for Admin API. Symptom: GraphQL returns **403** with message about non-expiring tokens; theme embed detection falsely reports “not active”.

**How this app handles it:**

- `lib/ensure-offline-session.ts` — on each admin API request, migrates legacy non-expiring tokens via `shopify.auth.migrateToExpiringToken`, refreshes expired tokens via `shopify.auth.refreshToken`.
- `lib/authenticate-admin.ts` — token exchange uses `expiring: true`.
- `app/api/auth/callback/route.ts` — OAuth callback uses `expiring: true`.
- `lib/session-storage.ts` — persists `refreshToken` and `refreshTokenExpires` in `Session` table (schema already has columns).

If Admin API calls fail after reinstall, have merchant **reload the embedded app** once so migration runs. Do not assume missing embed — check server logs for 403 token errors first.

## Logo URLs (admin preview vs storefront)

- **Admin preview / templates:** relative paths `/api/publishers/{id}/logo` via `bundledLogoPath()` in `lib/resolve-storefront-publishers.ts`.
- **Storefront / app-proxy payloads:** absolute URLs via `absoluteLogoUrls: true` in `lib/build-storefront-payload.ts`.
- `components/presswall/publisher-logo.tsx` uses native `<img>` (not `next/image`) for embedded-admin reliability.

## Theme activation detection

- API: `GET /api/theme-activation` → `lib/theme-activation.ts`.
- Requires `read_themes` scope; reads main theme `config/settings_data.json` for app embed block (`presswall-embed`) and template JSON for section block (`presswall`).
- Block type matching accepts API key, extension UID, or app handle `presswall` / extension handle `presswall-theme`.
- Onboarding step 3 (`components/presswall/onboarding-go-live-step.tsx`) polls this endpoint.

## Verify changes

```bash
bun run lint        # ultracite check (Biome)
bun run typecheck   # tsc --noEmit
bun run test        # bun:test — unit tests in lib/*.test.ts
```

Run a single test file: `bun test lib/presswall-marquee.test.ts` (or `--test-name-pattern "..."`).

Use `bun run format` (`ultracite fix`) before commit if you touched formatting/lint issues.

`bun run build` works without Shopify secrets in env (lazy-init for `lib/shopify.ts` and `src/db/index.ts`).

## Layout (where to edit)

| Area | Path |
|------|------|
| Admin UI (embedded) | `app/page.tsx`, `components/presswall/`, `hooks/use-presswall-editor.ts` |
| API routes | `app/api/` — `presswall`, `publishers`, `custom-templates`, `proxy/config`, `auth`, `webhooks`, `theme-activation` |
| Shopify session / auth | `lib/authenticate-*.ts`, `lib/ensure-offline-session.ts`, `lib/session-storage.ts`, `lib/shopify.ts` |
| Business logic | `lib/presswall-service.ts`, `lib/custom-template-service.ts`, `lib/resolve-storefront-publishers.ts`, `lib/publishers-seed.ts` |
| Shop cleanup (GDPR/uninstall) | `lib/shop-cleanup.ts`, `app/api/webhooks/route.ts` |
| DB (Drizzle) | `src/db/schema.ts`, `src/db/index.ts`, `src/db/constants.ts`; migrations in `drizzle/` |
| Bundled outlet logos | `public/publishers/logos/`, catalog in `lib/bundled-publishers.ts` |
| Theme app extension | `extensions/presswall-theme/` |
| Docker / deploy | `Dockerfile`, `.dockerignore`, `scripts/deploy-aws-*.sh`, `scripts/update-vps-container.sh` |

Path alias: `@/*` → repo root (`tsconfig.json`).

## Database

- **Turso** when `TURSO_DATABASE_URL` (+ token) are set; otherwise local SQLite `file:data/dev.db`.
- `drizzle.config.ts` uses the same `getTursoConfig()` as runtime — env must be loaded for `db:push` / `db:studio` / `db:generate`.
- `db:push` is two-phase: `bun run db:apply-pending` runs the hand-written, idempotent ALTER list in `scripts/apply-pending-migrations.ts` (ignores "duplicate column"/"already exists" errors), then `drizzle-kit push` syncs the schema. Keep new additive column changes in that script until next schema reset.
- `bun run db:reset-onboarding <shop.myshopify.com>` clears a shop's onboarding flag to re-trigger the admin flow.
- Publisher catalog is **seeded on first authenticated admin page load** (`ensurePublisherCatalogSeeded` in `app/page.tsx`), not via a separate seed script.

## Shopify specifics

- Scopes: `write_app_proxy`, `read_themes` (both required).
- App proxy: storefront calls under `apps/presswall` → `app/api/proxy/`.
- Webhooks: `app/uninstalled` + GDPR compliance (`customers/data_request`, `customers/redact`, `shop/redact`) → `app/api/webhooks/route.ts` → `purgeShopData()`.
- Storefront config metafield: `shop.metafields.app.storefront_config` — synced via `lib/sync-storefront-metafield.ts` (403 if token/scopes bad).
- Dev store: `noxify-dvgwvtrt.myshopify.com` (in `shopify.app.toml`).
- When changing app URLs, auth, or store-facing GraphQL, prefer Shopify skills/CLI docs over guessing.

## Security headers

`lib/embedded-headers.ts` (via middleware): CSP for embedded app, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. **HSTS only when `NODE_ENV=production`** (avoid sticking HSTS in local HTTP dev).

## Troubleshooting (production)

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| “Embed not detected” despite embed on | Admin API 403 (non-expiring token) or missing `read_themes` | Reload app; check `ensure-offline-session` migration in logs; verify container `SCOPES` |
| Logos missing in admin preview | Was absolute URLs + DNS/`next/image` issues | Should use relative `/api/publishers/.../logo` in admin (already fixed) |
| `metafield sync failed (403)` | Bad token or missing scope | Fix scopes + token migration; reinstall if needed |
| `shopify app dev` OAuth broken | `shopify.app.toml` pointing at prod | Restore ngrok URLs; `automatically_update_urls_on_dev = true` |
| DNS flaky for `presswall.noxify.io` | Propagation / resolver differences | A record → `35.169.154.151`; may need `/etc/hosts` workaround temporarily |

**Useful checks:**

```bash
curl -sI https://presswall.noxify.io
curl -sI https://presswall.noxify.io/api/publishers/techcrunch/logo
curl -s "https://dns.google/resolve?name=presswall.noxify.io&type=A"
ssh -i ~/.ssh/presswall-debian.pem admin@35.169.154.151 'sudo docker logs presswall 2>&1 | tail -50'
```

## Assets & scripts

- Bulk logo prep (ImageMagick): `scripts/process-publisher-logos.sh /path/to/sources` → writes silhouettes to `public/publishers/logos/`.
- Custom merchant SVGs: sanitized in `lib/svg-sanitize.ts`; `components/presswall/svg-logo.tsx` uses `dangerouslySetInnerHTML` — Biome rule is explicitly off in `biome.jsonc` for that file only.

## Linting

Ultracite/Biome preset (`biome.jsonc` extends `ultracite/biome/*`). Repo-specific override: only `svg-logo.tsx` for `noDangerouslySetInnerHtml`. Pre-existing lint noise in `remotion/` is unrelated to the app — don't block app work on it.

## App Store (not done yet)

Still needed in Partner Dashboard: free public plan, listing (screenshots, description), privacy policy URL, submit for review.