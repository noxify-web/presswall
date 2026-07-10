import { beforeAll, describe, expect, test } from "bun:test";
import { createClient } from "@libsql/client";
import { updateShopBanner } from "@/lib/banner-service";
import { getResolvedStorefrontPayload } from "@/lib/build-storefront-payload";
import {
  listShopCustomTemplates,
  saveShopCustomTemplate,
} from "@/lib/custom-template-service";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import { bootstrapShopBanners } from "@/lib/shop-banner-bootstrap";

const CUSTOM_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';

const TEST_SHOP = `banner-persist-${Date.now()}.myshopify.com`;
const CUSTOM_LOGO_ID = crypto.randomUUID();

beforeAll(async () => {
  const client = createClient({ url: "file:data/dev.db" });
  await client.execute({
    sql: `INSERT INTO shop_custom_logos (id, shop, name, logo_svg, created_at)
      VALUES (?, ?, ?, ?, ?)`,
    args: [
      CUSTOM_LOGO_ID,
      TEST_SHOP,
      "Local Podcast",
      CUSTOM_SVG,
      new Date().toISOString(),
    ],
  });
});

describe("save/list shop banners (legacy create path)", () => {
  test("list still returns rows; storefront only serves the default/canonical banner", async () => {
    // Ensure a default exists first so bootstrap does not steal the first custom row.
    await bootstrapShopBanners(TEST_SHOP);
    const bootstrap = await bootstrapShopBanners(TEST_SHOP);
    expect(bootstrap.defaultBannerId).not.toBeNull();

    await saveShopCustomTemplate(TEST_SHOP, {
      name: "Banner A",
      config: {
        ...DEFAULT_PRESSWALL_CONFIG,
        headingText: "Banner A",
      },
      selections: [{ publisherId: "forbes", position: 0 }],
    });

    await saveShopCustomTemplate(TEST_SHOP, {
      name: "Banner B",
      config: {
        ...DEFAULT_PRESSWALL_CONFIG,
        headingText: "Banner B",
      },
      selections: [{ publisherId: "wired", position: 0 }],
    });

    // Point the default/canonical design at a known config.
    await updateShopBanner(
      TEST_SHOP,
      bootstrap.defaultBannerId as string,
      {
        ...DEFAULT_PRESSWALL_CONFIG,
        headingText: "Live design",
      },
      [{ publisherId: "techcrunch", position: 0 }]
    );

    const listed = await listShopCustomTemplates(TEST_SHOP);
    expect(listed.length).toBeGreaterThanOrEqual(3);
    expect(listed.some((b) => b.name === "Banner A")).toBe(true);
    expect(listed.some((b) => b.name === "Banner B")).toBe(true);

    const payload = await getResolvedStorefrontPayload(TEST_SHOP, []);
    expect(payload.headingText).toBe("Live design");
    expect(payload.headingText).not.toBe("Banner A");
    expect(payload.headingText).not.toBe("Banner B");
  });

  test("custom logo id selections resolve on the canonical banner", async () => {
    await bootstrapShopBanners(TEST_SHOP);
    const bootstrap = await bootstrapShopBanners(TEST_SHOP);
    const defaultId = bootstrap.defaultBannerId;
    expect(defaultId).not.toBeNull();

    await updateShopBanner(
      TEST_SHOP,
      defaultId as string,
      {
        ...DEFAULT_PRESSWALL_CONFIG,
        headingText: "Press picks",
      },
      [{ customLogoId: CUSTOM_LOGO_ID, position: 0 }]
    );

    const payload = await getResolvedStorefrontPayload(TEST_SHOP, []);

    expect(payload.headingText).toBe("Press picks");
    expect(payload.publishers[0]?.name).toBe("Local Podcast");
    expect(payload.publishers[0]?.logoSvg).toBe(CUSTOM_SVG);
  });
});
