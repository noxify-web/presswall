import { describe, expect, test } from "bun:test";
import { resolveMetafieldLogoUrl } from "@/lib/metafield-logo-url";

const SHOP = "example.myshopify.com";
const PROD = "https://presswall.noxify.io";

describe("resolveMetafieldLogoUrl", () => {
  test("preserves white variant from the live payload URL", () => {
    const url = resolveMetafieldLogoUrl(
      SHOP,
      "forbes",
      "https://reissue-irritable-slider.ngrok-free.dev/api/publishers/forbes/logo?variant=white",
      { appUrl: PROD, colorMode: "white" }
    );

    expect(url).toBe(
      "https://presswall.noxify.io/api/publishers/forbes/logo?variant=white"
    );
  });

  test("uses colorMode when the source URL has no variant query", () => {
    const url = resolveMetafieldLogoUrl(
      SHOP,
      "forbes",
      "https://presswall.noxify.io/api/publishers/forbes/logo",
      { appUrl: PROD, colorMode: "white" }
    );

    expect(url).toBe(
      "https://presswall.noxify.io/api/publishers/forbes/logo?variant=white"
    );
  });

  test("never drops white down to color/black defaults", () => {
    // Regression: old code called absoluteBundledLogoUrl(id) → variant=color
    const url = resolveMetafieldLogoUrl(
      SHOP,
      "bloomberg",
      "https://presswall.noxify.io/api/publishers/bloomberg/logo?variant=white",
      { appUrl: PROD, colorMode: "white" }
    );

    expect(url).toContain("variant=white");
    expect(url).not.toContain("variant=color");
    expect(url).not.toContain("variant=black");
  });

  test("falls back to shop app-proxy path when app URL is not https prod", () => {
    const url = resolveMetafieldLogoUrl(
      SHOP,
      "cnbc",
      "http://localhost:3000/api/publishers/cnbc/logo?variant=black",
      { appUrl: "http://localhost:3000", colorMode: "black" }
    );

    expect(url).toBe(
      "https://example.myshopify.com/apps/presswall/publishers/cnbc/logo?variant=black"
    );
  });

  test("returns null for missing logo urls", () => {
    expect(
      resolveMetafieldLogoUrl(SHOP, "forbes", null, {
        appUrl: PROD,
        colorMode: "white",
      })
    ).toBeNull();
  });
});
