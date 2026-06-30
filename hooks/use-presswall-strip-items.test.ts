import { describe, expect, test } from "bun:test";
import { hydrateBannerSelections } from "@/lib/hydrate-banner-selections";
import { resolveStorefrontPublishers } from "@/lib/resolve-storefront-publishers";

const CUSTOM_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';

describe("usePresswallStripItems resolution path", () => {
  test("resolves custom logo id selections when customLogos are provided", () => {
    const customLogos = [
      {
        id: "logo-podcast",
        name: "Local Podcast",
        logoSvg: CUSTOM_SVG,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    const selections = [{ customLogoId: "logo-podcast", position: 0 }];
    const hydratedSelections = hydrateBannerSelections(selections, customLogos);
    const items = resolveStorefrontPublishers([], hydratedSelections, {
      customLogos,
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "logo-podcast",
      isCustom: true,
      name: "Local Podcast",
      logoSvg: CUSTOM_SVG,
    });
  });
});
