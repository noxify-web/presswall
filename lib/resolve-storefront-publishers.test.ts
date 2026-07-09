import { describe, expect, test } from "bun:test";
import type { PublisherCatalogItem } from "@/lib/presswall-types";
import { resolveStorefrontPublishers } from "@/lib/resolve-storefront-publishers";

const catalog: PublisherCatalogItem[] = [
  {
    id: "techcrunch",
    name: "TechCrunch",
    category: "Tech",
    websiteUrl: "https://techcrunch.com",
    logoSvg: "",
    logoMonoSvg: "",
  },
];

const CUSTOM_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';

describe("resolveStorefrontPublishers", () => {
  test("resolves bundled publishers from catalog", () => {
    const publishers = resolveStorefrontPublishers(catalog, [
      { publisherId: "techcrunch", position: 0 },
    ]);

    expect(publishers).toHaveLength(1);
    expect(publishers[0]).toMatchObject({
      id: "techcrunch",
      isCustom: false,
      name: "TechCrunch",
      logoSvg: "",
    });
    expect(publishers[0]?.logoImageUrl).toBe(
      "/api/publishers/techcrunch/logo?variant=black"
    );
  });

  test("resolves logo variant from colorMode", () => {
    const color = resolveStorefrontPublishers(
      catalog,
      [{ publisherId: "techcrunch", position: 0 }],
      { colorMode: "color" }
    );
    const white = resolveStorefrontPublishers(
      catalog,
      [{ publisherId: "techcrunch", position: 0 }],
      { colorMode: "white" }
    );
    const monoLegacy = resolveStorefrontPublishers(
      catalog,
      [{ publisherId: "techcrunch", position: 0 }],
      { colorMode: "mono" }
    );

    expect(color[0]?.logoImageUrl).toBe(
      "/api/publishers/techcrunch/logo?variant=color"
    );
    expect(white[0]?.logoImageUrl).toBe(
      "/api/publishers/techcrunch/logo?variant=white"
    );
    expect(monoLegacy[0]?.logoImageUrl).toBe(
      "/api/publishers/techcrunch/logo?variant=black"
    );
  });

  test("can resolve absolute bundled logo urls for storefront payloads", () => {
    const publishers = resolveStorefrontPublishers(
      catalog,
      [{ publisherId: "techcrunch", position: 0 }],
      { absoluteLogoUrls: true, colorMode: "black" }
    );

    expect(publishers[0]?.logoImageUrl).toContain(
      "/api/publishers/techcrunch/logo?variant=black"
    );
  });

  test("drops unknown bundled publisher ids", () => {
    const publishers = resolveStorefrontPublishers(catalog, [
      { publisherId: "missing-outlet", position: 0 },
    ]);

    expect(publishers).toHaveLength(0);
  });

  test("resolves custom outlets with sanitized svg", () => {
    const publishers = resolveStorefrontPublishers(catalog, [
      {
        customName: "Local Podcast",
        customLogoSvg: CUSTOM_SVG,
        position: 0,
      },
    ]);

    expect(publishers).toHaveLength(1);
    expect(publishers[0]).toMatchObject({
      id: "custom-0",
      isCustom: true,
      name: "Local Podcast",
      logoImageUrl: null,
      logoSvg: CUSTOM_SVG,
    });
  });

  test("drops custom outlets without a name", () => {
    const publishers = resolveStorefrontPublishers(catalog, [
      {
        customLogoSvg: CUSTOM_SVG,
        position: 0,
      },
    ]);

    expect(publishers).toHaveLength(0);
  });

  test("resolves custom outlets from library logo id", () => {
    const publishers = resolveStorefrontPublishers(
      catalog,
      [{ customLogoId: "logo-podcast", position: 0 }],
      {
        customLogos: [
          {
            id: "logo-podcast",
            name: "Local Podcast",
            logoSvg: CUSTOM_SVG,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      }
    );

    expect(publishers).toHaveLength(1);
    expect(publishers[0]).toMatchObject({
      id: "logo-podcast",
      isCustom: true,
      name: "Local Podcast",
      logoSvg: CUSTOM_SVG,
    });
  });

  test("sanitizes malicious custom svg before storefront render", () => {
    const publishers = resolveStorefrontPublishers(catalog, [
      {
        customName: "Unsafe",
        customLogoSvg:
          '<svg onload="alert(1)"><script>alert(1)</script><rect width="1" height="1"/></svg>',
        position: 0,
      },
    ]);

    expect(publishers[0]?.logoSvg).not.toContain("script");
    expect(publishers[0]?.logoSvg).not.toContain("onload");
  });
});
