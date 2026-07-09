import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MAX_CUSTOM_LOGO_SVG_LENGTH } from "@/lib/presswall-validation";
import { PRESSWALL_THEME_EXTENSION_UID } from "@/lib/theme-extension";

const THEME_MAX_CUSTOM_LOGO_SVG_LENGTH =
  /const MAX_CUSTOM_LOGO_SVG_LENGTH = 50[,_]?000;/;
const LIQUID_SCHEMA_PATTERN = /{% schema %}\s*([\s\S]*?)\s*{% endschema %}/;

function readBlockSchema(blockPath: string) {
  const liquid = readFileSync(join(process.cwd(), blockPath), "utf8");
  const schemaMatch = liquid.match(LIQUID_SCHEMA_PATTERN);
  if (!schemaMatch?.[1]) {
    throw new Error(`Missing schema block in ${blockPath}`);
  }

  return JSON.parse(schemaMatch[1]) as { javascript?: string };
}

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
    expect(presswallLive).toContain("data-presswall-root");
    expect(presswallLive).toContain("data-proxy-url");
    expect(presswallLive).toContain("data-page-type");
    expect(presswallLive).toContain("data-product-id");
    expect(presswallLive).not.toContain("pw.publishers");
    expect(themeJs).toContain('querySelectorAll("[data-presswall-root]")');
  });

  test("declares presswall.js in both theme block schemas", () => {
    const presswallBlockSchema = readBlockSchema(
      "extensions/presswall-theme/blocks/presswall.liquid"
    );
    const presswallEmbedSchema = readBlockSchema(
      "extensions/presswall-theme/blocks/presswall-embed.liquid"
    );

    expect(presswallBlockSchema.javascript).toBe("presswall.js");
    expect(presswallEmbedSchema.javascript).toBe("presswall.js");
  });

  test("keeps theme extension UID in sync with shopify.extension.toml", () => {
    const toml = readFileSync(
      join(process.cwd(), "extensions/presswall-theme/shopify.extension.toml"),
      "utf8"
    );

    expect(toml).toContain(`uid = "${PRESSWALL_THEME_EXTENSION_UID}"`);
  });

  test("theme JS uses pre-rendered logo assets (no CSS invert path)", () => {
    const themeJs = readFileSync(
      join(process.cwd(), "extensions/presswall-theme/assets/presswall.js"),
      "utf8"
    );

    // Color/black/white come from app assets — storefront must not invert via CSS.
    expect(themeJs).toContain("pre-rendered pure assets");
    expect(themeJs).toContain("no grayscale/invert filters");
    expect(themeJs).not.toContain("shouldInvertLogos");
    expect(themeJs).not.toContain("relativeLuminance");
  });

  test("theme CSS does not retain retired grid layout class", () => {
    const themeCss = readFileSync(
      join(process.cwd(), "extensions/presswall-theme/assets/presswall.css"),
      "utf8"
    );

    expect(themeCss).not.toContain(".presswall-grid");
  });
});
