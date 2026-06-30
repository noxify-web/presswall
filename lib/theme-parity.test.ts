import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MAX_CUSTOM_LOGO_SVG_LENGTH } from "@/lib/presswall-validation";

const THEME_MAX_CUSTOM_LOGO_SVG_LENGTH =
  /const MAX_CUSTOM_LOGO_SVG_LENGTH = 50[,_]?000;/;

describe("theme bundle parity", () => {
  test("keeps custom logo svg length limit in sync with theme JS", () => {
    const themeJs = readFileSync(
      join(process.cwd(), "extensions/presswall-theme/assets/presswall.js"),
      "utf8"
    );

    expect(themeJs).toMatch(THEME_MAX_CUSTOM_LOGO_SVG_LENGTH);
    expect(MAX_CUSTOM_LOGO_SVG_LENGTH).toBe(50_000);
  });

  test("forwards storefront page context to the app-proxy config URL", () => {
    const themeJs = readFileSync(
      join(process.cwd(), "extensions/presswall-theme/assets/presswall.js"),
      "utf8"
    );
    const presswallBlock = readFileSync(
      join(process.cwd(), "extensions/presswall-theme/blocks/presswall.liquid"),
      "utf8"
    );
    const presswallEmbed = readFileSync(
      join(
        process.cwd(),
        "extensions/presswall-theme/blocks/presswall-embed.liquid"
      ),
      "utf8"
    );
    const presswallLive = readFileSync(
      join(
        process.cwd(),
        "extensions/presswall-theme/snippets/presswall-live.liquid"
      ),
      "utf8"
    );

    expect(themeJs).toContain("buildContextAwareProxyUrl");
    expect(themeJs).toContain('searchParams.set("page_type"');
    expect(themeJs).toContain('searchParams.set("product_id"');
    expect(presswallBlock).toContain("data-page-type");
    expect(presswallBlock).toContain("data-product-id");
    expect(presswallEmbed).toContain("data-page-type");
    expect(presswallEmbed).toContain("data-product-id");
    expect(presswallLive).toContain("data-page-type");
    expect(presswallLive).toContain("data-product-id");
    expect(presswallLive).not.toContain("pw.publishers");
  });
});
