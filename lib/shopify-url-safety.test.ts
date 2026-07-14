import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readToml(name: string) {
  return readFileSync(join(root, name), "utf8");
}

describe("Shopify URL safety (merchant protection)", () => {
  test("dev config never enables Partner URL auto-update", () => {
    const toml = readToml("shopify.app.toml");
    expect(toml).toMatch(/^\s*automatically_update_urls_on_dev\s*=\s*false\s*$/m);
    expect(toml).not.toMatch(/^\s*automatically_update_urls_on_dev\s*=\s*true\s*$/m);
  });

  test("prod config pins presswall.noxify.io and never tunnels", () => {
    const toml = readToml("shopify.app.prod.toml");
    expect(toml).toMatch(/^\s*automatically_update_urls_on_dev\s*=\s*false\s*$/m);
    expect(toml).toMatch(
      /^\s*application_url\s*=\s*"https:\/\/presswall\.noxify\.io"\s*$/m
    );
    expect(toml).toContain("https://presswall.noxify.io/api/proxy");
    expect(toml).toContain("https://presswall.noxify.io/api/auth/callback");
    expect(toml).not.toMatch(/ngrok|trycloudflare|loca\.lt/i);
  });

  test("package scripts keep prod deploy and end-dev recovery", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["shopify:deploy:prod"]).toContain("-c prod");
    expect(pkg.scripts["shopify:deploy:prod"]).toContain(
      "shopify-dev-clean-store.sh"
    );
    expect(pkg.scripts["shopify:end-dev"]).toBeTruthy();
    expect(pkg.scripts["shopify:dev-clean"]).toContain(
      "shopify-dev-clean-store.sh"
    );
    expect(pkg.scripts["shopify:restore-urls"]).toContain("-c prod");
    expect(pkg.scripts["check:shopify-urls"]).toContain(
      "assert-shopify-url-safety.sh"
    );

    const cleanScript = readFileSync(
      join(root, "scripts/shopify-dev-clean-store.sh"),
      "utf8"
    );
    expect(cleanScript).toContain("noxify-dvgwvtrt.myshopify.com");
    expect(cleanScript).toContain("shopify app dev clean");
  });
});
