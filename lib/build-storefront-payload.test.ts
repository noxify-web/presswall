import { beforeAll, describe, expect, test } from "bun:test";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import {
  buildStorefrontPayload,
  getResolvedStorefrontPayload,
} from "@/lib/build-storefront-payload";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import { bootstrapShopBanners } from "@/lib/shop-banner-bootstrap";
import { db } from "@/src/db";
import { shopCustomTemplates } from "@/src/db/schema";

const CUSTOM_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';

const RESOLVED_TEST_SHOP = `resolved-banner-${Date.now()}.myshopify.com`;
const MULTI_BANNER_SHOP = `multi-banner-${Date.now()}.myshopify.com`;
const CUSTOM_LOGO_ID = crypto.randomUUID();

beforeAll(async () => {
  const client = createClient({ url: "file:data/dev.db" });
  await client.execute({
    sql: `INSERT INTO shop_custom_logos (id, shop, name, logo_svg, created_at)
      VALUES (?, ?, ?, ?, ?)`,
    args: [
      CUSTOM_LOGO_ID,
      RESOLVED_TEST_SHOP,
      "Local Podcast",
      CUSTOM_SVG,
      new Date().toISOString(),
    ],
  });

  await bootstrapShopBanners(RESOLVED_TEST_SHOP);
  const bootstrap = await bootstrapShopBanners(RESOLVED_TEST_SHOP);
  const defaultId = bootstrap.defaultBannerId;
  if (!defaultId) {
    throw new Error("expected default banner");
  }

  const now = new Date().toISOString();
  await db
    .update(shopCustomTemplates)
    .set({
      configJson: JSON.stringify({
        ...DEFAULT_PRESSWALL_CONFIG,
        headingText: "Press picks",
      }),
      selectionsJson: JSON.stringify([
        { customLogoId: CUSTOM_LOGO_ID, position: 0 },
      ]),
      updatedAt: now,
    })
    .where(eq(shopCustomTemplates.id, defaultId));
});

describe("buildStorefrontPayload", () => {
  test("hydrates custom logo ids from the shop library before resolving publishers", () => {
    const payload = buildStorefrontPayload(
      {
        ...DEFAULT_PRESSWALL_CONFIG,
        headingText: "Custom banner",
      },
      [{ customLogoId: "logo-podcast", position: 0 }],
      [],
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

    expect(payload.headingText).toBe("Custom banner");
    expect(payload.publishers).toHaveLength(1);
    expect(payload.publishers[0]).toMatchObject({
      id: "logo-podcast",
      isCustom: true,
      name: "Local Podcast",
      logoSvg: CUSTOM_SVG,
    });
  });
});

describe("getResolvedStorefrontPayload", () => {
  test("loads the canonical banner and hydrates custom logos", async () => {
    const payload = await getResolvedStorefrontPayload(RESOLVED_TEST_SHOP, []);

    expect(payload.headingText).toBe("Press picks");
    expect(payload.publishers).toHaveLength(1);
    expect(payload.publishers[0]).toMatchObject({
      id: CUSTOM_LOGO_ID,
      isCustom: true,
      name: "Local Podcast",
      logoSvg: CUSTOM_SVG,
    });
  });

  test("returns the same design regardless of page context arguments", async () => {
    const client = createClient({ url: "file:data/dev.db" });
    const now = new Date().toISOString();
    const defaultId = crypto.randomUUID();
    const productBannerId = crypto.randomUUID();

    await client.execute({
      sql: `INSERT INTO shop_custom_templates
        (id, shop, name, description, config_json, selections_json, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        defaultId,
        MULTI_BANNER_SHOP,
        "Default",
        null,
        JSON.stringify({
          ...DEFAULT_PRESSWALL_CONFIG,
          headingText: "Canonical home",
        }),
        JSON.stringify([{ publisherId: "forbes", position: 0 }]),
        1,
        now,
        now,
      ],
    });

    await client.execute({
      sql: `INSERT INTO shop_custom_templates
        (id, shop, name, description, config_json, selections_json, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        productBannerId,
        MULTI_BANNER_SHOP,
        "Product only",
        null,
        JSON.stringify({
          ...DEFAULT_PRESSWALL_CONFIG,
          headingText: "Product strip",
        }),
        JSON.stringify([{ publisherId: "wired", position: 0 }]),
        0,
        now,
        "2026-12-01T00:00:00.000Z",
      ],
    });

    // Legacy assignments that previously made product pages show a different banner.
    await client.execute({
      sql: `INSERT INTO shop_banner_assignments (id, shop, target, banner_id, updated_at)
        VALUES (?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        MULTI_BANNER_SHOP,
        "homepage",
        defaultId,
        now,
      ],
    });
    await client.execute({
      sql: `INSERT INTO shop_banner_assignments (id, shop, target, banner_id, updated_at)
        VALUES (?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        MULTI_BANNER_SHOP,
        "all_products",
        productBannerId,
        now,
      ],
    });
    await client.execute({
      sql: `INSERT INTO shop_banner_assignments (id, shop, target, banner_id, updated_at)
        VALUES (?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        MULTI_BANNER_SHOP,
        "product:4242",
        productBannerId,
        now,
      ],
    });

    const noContext = await getResolvedStorefrontPayload(MULTI_BANNER_SHOP, []);
    const homepage = await getResolvedStorefrontPayload(MULTI_BANNER_SHOP, [], {
      pageType: "homepage",
    });
    const product = await getResolvedStorefrontPayload(MULTI_BANNER_SHOP, [], {
      pageType: "product",
      productId: "4242",
    });

    expect(noContext.headingText).toBe("Canonical home");
    expect(homepage.headingText).toBe("Canonical home");
    expect(product.headingText).toBe("Canonical home");
    expect(noContext.headingText).toBe(homepage.headingText);
    expect(homepage.headingText).toBe(product.headingText);
    expect(product.headingText).not.toBe("Product strip");
  });
});
