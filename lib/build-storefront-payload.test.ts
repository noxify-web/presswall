import { beforeAll, describe, expect, test } from "bun:test";
import { createClient } from "@libsql/client";
import { saveShopBannerAssignments } from "@/lib/banner-assignment-service";
import {
  buildStorefrontPayload,
  getResolvedStorefrontPayload,
} from "@/lib/build-storefront-payload";
import { saveShopCustomTemplate } from "@/lib/custom-template-service";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";

const CUSTOM_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';

const RESOLVED_TEST_SHOP = `resolved-banner-${Date.now()}.myshopify.com`;
const CUSTOM_LOGO_ID = crypto.randomUUID();
let resolvedBannerId = "";

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

  const saved = await saveShopCustomTemplate(RESOLVED_TEST_SHOP, {
    name: "Custom Logo Resolved Banner",
    config: {
      ...DEFAULT_PRESSWALL_CONFIG,
      headingText: "Press picks",
    },
    selections: [{ customLogoId: CUSTOM_LOGO_ID, position: 0 }],
  });

  resolvedBannerId = saved.id;

  await saveShopBannerAssignments(RESOLVED_TEST_SHOP, {
    homepageBannerId: resolvedBannerId,
    allProductsBannerId: resolvedBannerId,
  });
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
  test("loads custom logos from the shop library for assigned banners", async () => {
    const payload = await getResolvedStorefrontPayload(RESOLVED_TEST_SHOP, [], {
      pageType: "homepage",
    });

    expect(payload.headingText).toBe("Press picks");
    expect(payload.publishers).toHaveLength(1);
    expect(payload.publishers[0]).toMatchObject({
      id: CUSTOM_LOGO_ID,
      isCustom: true,
      name: "Local Podcast",
      logoSvg: CUSTOM_SVG,
    });
  });
});
