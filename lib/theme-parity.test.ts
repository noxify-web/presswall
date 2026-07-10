import { describe, expect, test } from "bun:test";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { MAX_CUSTOM_LOGO_SVG_LENGTH } from "@/lib/presswall-validation";
import { PRESSWALL_THEME_EXTENSION_UID } from "@/lib/theme-extension";

/** Minified ship asset may use `5e4`; source uses `50_000`. */
const THEME_MAX_CUSTOM_LOGO_SVG_LENGTH =
  /MAX_CUSTOM_LOGO_SVG_LENGTH\s*=\s*(50[_]?000|5e4)/;
const LIQUID_SCHEMA_PATTERN = /{% schema %}\s*([\s\S]*?)\s*{% endschema %}/;
/** Shopify theme app block JS hard limit. */
const APP_BLOCK_JS_MAX_BYTES = 10_000;

function readThemeJs(name: "presswall.js" | "presswall.source.js") {
  return readFileSync(
    join(process.cwd(), "extensions/presswall-theme/assets", name),
    "utf8"
  );
}

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
    const themeJs = readThemeJs("presswall.js");
    const themeSource = readThemeJs("presswall.source.js");

    expect(themeJs).toMatch(THEME_MAX_CUSTOM_LOGO_SVG_LENGTH);
    expect(themeSource).toMatch(THEME_MAX_CUSTOM_LOGO_SVG_LENGTH);
    expect(MAX_CUSTOM_LOGO_SVG_LENGTH).toBe(50_000);
  });

  test("shipped presswall.js stays under Shopify app-block JS size limit", () => {
    const size = statSync(
      join(process.cwd(), "extensions/presswall-theme/assets/presswall.js")
    ).size;
    expect(size).toBeLessThanOrEqual(APP_BLOCK_JS_MAX_BYTES);
  });

  test("loads a single shop-wide design; theme editor uses metafield not page context", () => {
    const themeSource = readThemeJs("presswall.source.js");
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
    const fromConfig = readFileSync(
      join(
        process.cwd(),
        "extensions/presswall-theme/snippets/presswall-from-config.liquid"
      ),
      "utf8"
    );

    expect(themeSource).not.toContain("buildContextAwareProxyUrl");
    expect(themeSource).not.toContain('searchParams.set("page_type"');
    expect(themeSource).not.toContain('searchParams.set("product_id"');
    expect(themeSource).toContain("normalizePayload");
    expect(themeSource).toContain("hydrateFromProxy");
    expect(presswallBlock).not.toContain("data-page-type");
    expect(presswallBlock).not.toContain("data-product-id");
    expect(presswallBlock).toContain("storefront_config");
    expect(presswallBlock).toContain("presswall-from-config");
    expect(presswallBlock).toContain("data-presswall-config");
    expect(presswallEmbed).toContain("data-presswall-config");
    expect(fromConfig).toContain("config.publishers");
    expect(themeSource).toContain('querySelectorAll("[data-presswall-root]")');
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
    const themeSource = readThemeJs("presswall.source.js");

    // Color/black/white come from app assets — storefront must not invert via CSS.
    expect(themeSource).toContain("pre-rendered pure assets");
    expect(themeSource).toContain("no grayscale/invert filters");
    expect(themeSource).not.toContain("shouldInvertLogos");
    expect(themeSource).not.toContain("relativeLuminance");
  });

  test("theme CSS does not retain retired grid layout class", () => {
    const themeCss = readFileSync(
      join(process.cwd(), "extensions/presswall-theme/assets/presswall.css"),
      "utf8"
    );

    expect(themeCss).not.toContain(".presswall-grid");
  });
});
