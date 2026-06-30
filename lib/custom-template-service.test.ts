import { describe, expect, test } from "bun:test";
import {
  listShopCustomTemplates,
  saveShopCustomTemplate,
} from "@/lib/custom-template-service";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";

const TEST_SHOP = `banner-persist-${Date.now()}.myshopify.com`;

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
    expect(listed.length).toBe(2);
  });
});
