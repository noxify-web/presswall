import { describe, expect, test } from "bun:test";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { bootstrapShopBanners } from "@/lib/shop-banner-bootstrap";
import { db } from "@/src/db";
import { shopCustomTemplates } from "@/src/db/schema";

function legacyShopDomain(suffix: string) {
  return `bootstrap-${suffix}-${Date.now()}.myshopify.com`;
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

describe("bootstrapShopBanners", () => {
  test("migrates legacy shop config into a default banner with core assignments", async () => {
    const shop = legacyShopDomain("legacy");
    await seedLegacyShop(shop);

    const bootstrap = await bootstrapShopBanners(shop);

    expect(bootstrap.banners.length).toBeGreaterThan(0);
    expect(bootstrap.defaultBannerId).not.toBeNull();

    const defaultBanner = bootstrap.banners.find(
      (banner) => banner.id === bootstrap.defaultBannerId
    );
    expect(defaultBanner?.name).toBe("Default");
    expect(defaultBanner?.isDefault).toBe(true);
    expect(defaultBanner?.config.headingText).toBe("Legacy heading");
    expect(defaultBanner?.selections[0]?.publisherId).toBe("forbes");

    expect(bootstrap.assignmentsState.homepageBannerId).toBe(
      bootstrap.defaultBannerId
    );
    expect(bootstrap.assignmentsState.allProductsBannerId).toBe(
      bootstrap.defaultBannerId
    );
    expect(
      bootstrap.assignments.some(
        (assignment) => assignment.target === "homepage"
      )
    ).toBe(true);
    expect(
      bootstrap.assignments.some(
        (assignment) => assignment.target === "all_products"
      )
    ).toBe(true);
  });

  test("concurrent bootstrap calls remain idempotent for the same shop", async () => {
    const shop = legacyShopDomain("concurrent");
    await seedLegacyShop(shop);

    const [first, second, third] = await Promise.all([
      bootstrapShopBanners(shop),
      bootstrapShopBanners(shop),
      bootstrapShopBanners(shop),
    ]);

    expect(first.defaultBannerId).toBe(second.defaultBannerId);
    expect(second.defaultBannerId).toBe(third.defaultBannerId);

    const templates = await db
      .select({
        id: shopCustomTemplates.id,
        isDefault: shopCustomTemplates.isDefault,
      })
      .from(shopCustomTemplates)
      .where(eq(shopCustomTemplates.shop, shop));

    const defaultTemplates = templates.filter((template) => template.isDefault);
    expect(defaultTemplates).toHaveLength(1);
  });
});
