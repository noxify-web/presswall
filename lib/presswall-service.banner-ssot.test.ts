import { describe, expect, test } from "bun:test";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import {
  getShopConfig,
  getShopPublisherSelections,
  saveShopPresswall,
} from "@/lib/presswall-service";
import { bootstrapShopBanners } from "@/lib/shop-banner-bootstrap";
import { db } from "@/src/db";
import {
  shopConfigs,
  shopCustomTemplates,
  shopPublishers,
} from "@/src/db/schema";

function shopDomain(suffix: string) {
  return `ssot-${suffix}-${Date.now()}.myshopify.com`;
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

describe("banner SSOT save path", () => {
  test("save updates the banner and does not dual-write shop_publishers", async () => {
    const shop = shopDomain("save");
    await seedLegacyShop(shop);
    const bootstrap = await bootstrapShopBanners(shop);
    const bannerId = bootstrap.defaultBannerId;
    expect(bannerId).not.toBeNull();

    await saveShopPresswall(
      shop,
      {
        ...DEFAULT_PRESSWALL_CONFIG,
        headingText: "Banner is truth",
      },
      [{ publisherId: "wired", position: 0 }],
      { bannerId }
    );

    const config = await getShopConfig(shop);
    const selections = await getShopPublisherSelections(shop);

    expect(config.headingText).toBe("Banner is truth");
    expect(selections).toEqual([{ publisherId: "wired", position: 0 }]);

    const banners = await db
      .select()
      .from(shopCustomTemplates)
      .where(eq(shopCustomTemplates.shop, shop));

    const target = banners.find((row) => row.id === bannerId);
    expect(target).toBeDefined();
    expect(JSON.parse(target?.configJson ?? "{}").headingText).toBe(
      "Banner is truth"
    );
    expect(JSON.parse(target?.selectionsJson ?? "[]")).toEqual([
      { publisherId: "wired", position: 0 },
    ]);

    // Legacy shop_publishers rows are left alone (no dual-write).
    const publisherRows = await db
      .select()
      .from(shopPublishers)
      .where(eq(shopPublishers.shop, shop));

    expect(publisherRows.some((row) => row.publisherId === "forbes")).toBe(
      true
    );
    expect(publisherRows.some((row) => row.publisherId === "wired")).toBe(
      false
    );

    // shop_configs style columns are not rewritten to the new heading.
    const configRows = await db
      .select()
      .from(shopConfigs)
      .where(eq(shopConfigs.shop, shop));

    expect(configRows[0]?.headingText).toBe("Legacy heading");
  });

  test("completeOnboarding only sets onboarding metadata on shop_configs", async () => {
    const shop = shopDomain("onboard");
    await seedLegacyShop(shop);
    const bootstrap = await bootstrapShopBanners(shop);

    await saveShopPresswall(
      shop,
      {
        ...DEFAULT_PRESSWALL_CONFIG,
        headingText: "Onboarded",
      },
      [{ publisherId: "forbes", position: 0 }],
      {
        bannerId: bootstrap.defaultBannerId,
        completeOnboarding: true,
      }
    );

    const configRows = await db
      .select()
      .from(shopConfigs)
      .where(eq(shopConfigs.shop, shop));

    expect(configRows[0]?.onboardingCompletedAt).toBeTruthy();
    expect(configRows[0]?.headingText).toBe("Legacy heading");
  });
});
