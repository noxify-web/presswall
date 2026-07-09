import { describe, expect, test } from "bun:test";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { sessionStorage } from "@/lib/session-storage";
import { purgeShopData } from "@/lib/shop-cleanup";
import { db } from "@/src/db";
import {
  shopBannerAssignments,
  shopConfigs,
  shopCustomLogos,
  shopCustomTemplates,
  shopPublishers,
} from "@/src/db/schema";

function shopDomain(suffix: string) {
  return `cleanup-${suffix}-${Date.now()}.myshopify.com`;
}

describe("purgeShopData", () => {
  test("removes sessions and all shop-scoped records", async () => {
    const shop = shopDomain("full");
    const now = new Date().toISOString();
    const client = createClient({ url: "file:data/dev.db" });

    await client.execute({
      sql: `INSERT INTO shop_configs (
        shop, heading_text, show_heading, color_mode, layout, logo_height,
        gap, alignment, background_color, text_color, border_radius,
        padding_y, padding_x, marquee_speed, grayscale_opacity, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        shop,
        "Cleanup",
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

    const bannerId = crypto.randomUUID();
    await client.execute({
      sql: `INSERT INTO shop_custom_templates (
        id, shop, name, config_json, selections_json, is_default, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [bannerId, shop, "Default", "{}", "[]", 1, now, now],
    });

    await client.execute({
      sql: `INSERT INTO shop_banner_assignments (id, shop, target, banner_id, updated_at)
        VALUES (?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), shop, "homepage", bannerId, now],
    });

    await client.execute({
      sql: `INSERT INTO shop_custom_logos (id, shop, name, logo_svg, created_at)
        VALUES (?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        shop,
        "Logo",
        '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
        now,
      ],
    });

    await client.execute({
      sql: "INSERT INTO shop_publishers (shop, publisher_id, position) VALUES (?, ?, ?)",
      args: [shop, "forbes", 0],
    });

    const offlineId = `offline_${shop}`;
    await sessionStorage.storeSession({
      id: offlineId,
      shop,
      state: "active",
      isOnline: false,
      accessToken: "test-token",
    } as Parameters<typeof sessionStorage.storeSession>[0]);

    await purgeShopData(shop);

    const configs = await db
      .select()
      .from(shopConfigs)
      .where(eq(shopConfigs.shop, shop));
    const templates = await db
      .select()
      .from(shopCustomTemplates)
      .where(eq(shopCustomTemplates.shop, shop));
    const assignments = await db
      .select()
      .from(shopBannerAssignments)
      .where(eq(shopBannerAssignments.shop, shop));
    const logos = await db
      .select()
      .from(shopCustomLogos)
      .where(eq(shopCustomLogos.shop, shop));
    const publishers = await db
      .select()
      .from(shopPublishers)
      .where(eq(shopPublishers.shop, shop));
    const sessions = await sessionStorage.findSessionsByShop(shop);

    expect(configs).toHaveLength(0);
    expect(templates).toHaveLength(0);
    expect(assignments).toHaveLength(0);
    expect(logos).toHaveLength(0);
    expect(publishers).toHaveLength(0);
    expect(sessions).toHaveLength(0);
  });
});
