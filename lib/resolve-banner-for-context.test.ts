import { describe, expect, test } from "bun:test";
import { buildStorefrontPayload } from "@/lib/build-storefront-payload";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import type { PublisherCatalogItem } from "@/lib/presswall-types";
import {
  findBannerById,
  resolveBannerIdForContext,
  type ShopBannerRecord,
} from "@/lib/resolve-banner-for-context";

const catalog: PublisherCatalogItem[] = [
  {
    id: "forbes",
    name: "Forbes",
    category: "Business",
    websiteUrl: "https://forbes.com",
    logoSvg: "",
    logoMonoSvg: "",
  },
  {
    id: "wired",
    name: "Wired",
    category: "Tech",
    websiteUrl: "https://wired.com",
    logoSvg: "",
    logoMonoSvg: "",
  },
  {
    id: "techcrunch",
    name: "TechCrunch",
    category: "Tech",
    websiteUrl: "https://techcrunch.com",
    logoSvg: "",
    logoMonoSvg: "",
  },
];

function bannerFixture(input: {
  headingText: string;
  id: string;
  publisherId: string;
}): ShopBannerRecord {
  return {
    id: input.id,
    name: input.headingText,
    isDefault: false,
    config: {
      ...DEFAULT_PRESSWALL_CONFIG,
      headingText: input.headingText,
    },
    selections: [{ publisherId: input.publisherId, position: 0 }],
  };
}

function payloadForContext(
  banners: ShopBannerRecord[],
  assignments: Array<{
    bannerId: string;
    target: "homepage" | "all_products" | `product:${string}`;
  }>,
  context: Parameters<typeof resolveBannerIdForContext>[1]
) {
  const bannerId = resolveBannerIdForContext(assignments, context, null);
  const banner = findBannerById(banners, bannerId);
  if (!banner) {
    throw new Error("Expected banner fixture for test context");
  }

  return buildStorefrontPayload(banner.config, banner.selections, catalog);
}

describe("resolveBannerIdForContext", () => {
  const assignments = [
    { target: "homepage" as const, bannerId: "banner-home" },
    { target: "all_products" as const, bannerId: "banner-products" },
    { target: "product:4242" as const, bannerId: "banner-specific" },
  ];

  test("returns homepage banner on homepage context", () => {
    expect(
      resolveBannerIdForContext(assignments, { pageType: "homepage" }, null)
    ).toBe("banner-home");
  });

  test("returns product default banner on generic product context", () => {
    expect(
      resolveBannerIdForContext(assignments, { pageType: "product" }, null)
    ).toBe("banner-products");
  });

  test("returns specific product banner when product id matches", () => {
    expect(
      resolveBannerIdForContext(
        assignments,
        { pageType: "product", productId: "4242" },
        null
      )
    ).toBe("banner-specific");
  });
});

describe("page context storefront payload resolution", () => {
  const banners = [
    bannerFixture({
      id: "banner-home",
      headingText: "Featured in",
      publisherId: "forbes",
    }),
    bannerFixture({
      id: "banner-products",
      headingText: "As seen on",
      publisherId: "wired",
    }),
    bannerFixture({
      id: "banner-specific",
      headingText: "Press picks",
      publisherId: "techcrunch",
    }),
  ];

  test("returns distinct payloads across homepage, product, and specific product contexts", () => {
    const assignments = [
      { target: "homepage" as const, bannerId: "banner-home" },
      { target: "all_products" as const, bannerId: "banner-products" },
      { target: "product:4242" as const, bannerId: "banner-specific" },
    ];

    const homepagePayload = payloadForContext(banners, assignments, {
      pageType: "homepage",
    });
    const productPayload = payloadForContext(banners, assignments, {
      pageType: "product",
    });
    const specificPayload = payloadForContext(banners, assignments, {
      pageType: "product",
      productId: "4242",
    });

    expect(homepagePayload.headingText).toBe("Featured in");
    expect(productPayload.headingText).toBe("As seen on");
    expect(specificPayload.headingText).toBe("Press picks");

    expect(homepagePayload.publishers[0]?.id).toBe("forbes");
    expect(productPayload.publishers[0]?.id).toBe("wired");
    expect(specificPayload.publishers[0]?.id).toBe("techcrunch");
  });
});
