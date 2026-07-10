import { describe, expect, test } from "bun:test";
import { createClient } from "@libsql/client";
import { getResolvedStorefrontPayload } from "@/lib/build-storefront-payload";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import {
  getShopConfig,
  getShopPublisherSelections,
  saveShopPresswall,
} from "@/lib/presswall-service";
import { bootstrapShopBanners } from "@/lib/shop-banner-bootstrap";

function shopDomain(suffix: string) {
  return `single-save-${suffix}-${Date.now()}.myshopify.com`;
}

async function seedLegacyShop(shop: string) {
  const client = createClient({ url: "file:data/dev.db" });
  const now = new Date().toISOString();

  await client.execute({
    sql: `INSERT INTO shop_configs (
      shop, heading_text, show_heading, color_mode, layout, logo_height,
      gap, alignment, background_color, text_color, border_radius,
      padding_y, padding_x, marquee_speed, grayscale_opacity, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      shop,
      "Legacy heading",
      1,
      "mono",
      "bar",
      28,
      32,
      "center",
      "transparent",
      "#111111",
      0,
      40,
      24,
      30,
      70,
      now,
    ],
  });

  await client.execute({
    sql: `INSERT INTO shop_publishers (shop, publisher_id, position)
      VALUES (?, ?, ?)`,
    args: [shop, "forbes", 0],
  });
}

describe("single banner save path", () => {
  test("second save overwrites the one live design; storefront matches admin", async () => {
    const shop = shopDomain("overwrite");
    await seedLegacyShop(shop);
    await bootstrapShopBanners(shop);

    await saveShopPresswall(
      shop,
      {
        ...DEFAULT_PRESSWALL_CONFIG,
        headingText: "First save",
      },
      [{ publisherId: "forbes", position: 0 }]
    );

    await saveShopPresswall(
      shop,
      {
        ...DEFAULT_PRESSWALL_CONFIG,
        headingText: "Second save",
      },
      [{ publisherId: "wired", position: 0 }]
    );

    const config = await getShopConfig(shop);
    const selections = await getShopPublisherSelections(shop);
    const storefront = await getResolvedStorefrontPayload(shop, []);
    const storefrontProduct = await getResolvedStorefrontPayload(shop, [], {
      pageType: "product",
      productId: "999",
    });

    expect(config.headingText).toBe("Second save");
    expect(selections).toEqual([{ publisherId: "wired", position: 0 }]);
    expect(storefront.headingText).toBe("Second save");
    expect(storefrontProduct.headingText).toBe("Second save");
    expect(storefront.headingText).toBe(storefrontProduct.headingText);
  });

  test("save ignores bannerId option and always updates the canonical banner", async () => {
    const shop = shopDomain("ignore-id");
    await seedLegacyShop(shop);
    const bootstrap = await bootstrapShopBanners(shop);
    const canonicalId = bootstrap.defaultBannerId;
    expect(canonicalId).not.toBeNull();

    // Extra non-default banner row (legacy multi-banner leftover).
    const client = createClient({ url: "file:data/dev.db" });
    const orphanId = crypto.randomUUID();
    const now = new Date().toISOString();
    await client.execute({
      sql: `INSERT INTO shop_custom_templates
        (id, shop, name, description, config_json, selections_json, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        orphanId,
        shop,
        "Orphan",
        null,
        JSON.stringify({
          ...DEFAULT_PRESSWALL_CONFIG,
          headingText: "Orphan strip",
        }),
        JSON.stringify([{ publisherId: "wired", position: 0 }]),
        0,
        now,
        now,
      ],
    });

    const result = await saveShopPresswall(
      shop,
      {
        ...DEFAULT_PRESSWALL_CONFIG,
        headingText: "Canonical only",
      },
      [{ publisherId: "techcrunch", position: 0 }],
      { bannerId: orphanId }
    );

    expect(result.bannerId).toBe(canonicalId);

    const storefront = await getResolvedStorefrontPayload(shop, []);
    expect(storefront.headingText).toBe("Canonical only");
    expect(storefront.headingText).not.toBe("Orphan strip");
  });
});
