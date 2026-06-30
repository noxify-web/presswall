import { beforeAll, describe, expect, test } from "bun:test";
import { createClient } from "@libsql/client";
import { saveShopBannerAssignments } from "@/lib/banner-assignment-service";
import { getResolvedStorefrontPayload } from "@/lib/build-storefront-payload";
import {
  listShopCustomTemplates,
  saveShopCustomTemplate,
} from "@/lib/custom-template-service";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";

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

describe("save/list shop banners", () => {
  test("persists two distinct banners with config and selections", async () => {
    const bannerAConfig = {
      ...DEFAULT_PRESSWALL_CONFIG,
      headingText: "Banner A",
    };
    const bannerBConfig = {
      ...DEFAULT_PRESSWALL_CONFIG,
      headingText: "Banner B",
    };

    const savedA = await saveShopCustomTemplate(TEST_SHOP, {
      name: "Banner A",
      config: bannerAConfig,
      selections: [{ publisherId: "forbes", position: 0 }],
    });

    const savedB = await saveShopCustomTemplate(TEST_SHOP, {
      name: "Banner B",
      config: bannerBConfig,
      selections: [{ publisherId: "wired", position: 0 }],
    });

    const listed = await listShopCustomTemplates(TEST_SHOP);
    const byName = new Map(listed.map((banner) => [banner.name, banner]));

    expect(byName.get("Banner A")?.config.headingText).toBe("Banner A");
    expect(byName.get("Banner A")?.selections[0]?.publisherId).toBe("forbes");
    expect(byName.get("Banner B")?.config.headingText).toBe("Banner B");
    expect(byName.get("Banner B")?.selections[0]?.publisherId).toBe("wired");
    expect(savedA.id).not.toBe(savedB.id);
    expect(listed.length).toBeGreaterThanOrEqual(2);
  });

  test("persists custom logo id selections and resolves them via getResolvedStorefrontPayload", async () => {
    const saved = await saveShopCustomTemplate(TEST_SHOP, {
      name: "Custom Logo Banner",
      config: {
        ...DEFAULT_PRESSWALL_CONFIG,
        headingText: "Press picks",
      },
      selections: [{ customLogoId: CUSTOM_LOGO_ID, position: 0 }],
    });

    await saveShopBannerAssignments(TEST_SHOP, {
      homepageBannerId: saved.id,
      allProductsBannerId: saved.id,
    });

    const listed = await listShopCustomTemplates(TEST_SHOP);
    const banner = listed.find((entry) => entry.id === saved.id);

    expect(banner).toBeDefined();
    expect(banner?.selections[0]?.customLogoId).toBe(CUSTOM_LOGO_ID);

    const payload = await getResolvedStorefrontPayload(TEST_SHOP, [], {
      pageType: "homepage",
    });

    expect(payload.headingText).toBe("Press picks");
    expect(payload.publishers[0]?.name).toBe("Local Podcast");
    expect(payload.publishers[0]?.logoSvg).toBe(CUSTOM_SVG);
  });
});
