# Shopify dev vs prod URLs (Presswall)

**Canonical locations (use these; do not re-research):**

| Kind | Path |
|------|------|
| Always-on rule | `.grok/rules/shopify-dev-prod-urls.md` |
| Skill | `.grok/skills/presswall-shopify-urls/SKILL.md` |
| Full narrative | `AGENTS.md` → Protect live merchants |
| Scripts | `package.json` → `shopify:dev-clean`, `shopify:restore-urls`, `shopify:deploy:prod` |

## Instant end-of-dev / “Server Not Found”

```bash
bun run shopify:dev-clean
bun run shopify:restore-urls
```

- Production host: `https://presswall.noxify.io`
- Deploy to merchants: `bun run shopify:deploy:prod` (always `-c prod`)
- Deploy alone does **not** clear store tunnel preview; hard refresh does not either
