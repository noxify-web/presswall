import { describe, expect, test } from "bun:test";
import { buildStorefrontPayload } from "@/lib/build-storefront-payload";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";

const CUSTOM_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';

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
