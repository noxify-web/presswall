import { pickCanonicalShopBanner } from "@/lib/canonical-shop-banner";
import { getShopCustomLogos } from "@/lib/custom-logo-service";
import { hydrateBannerSelections } from "@/lib/hydrate-banner-selections";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import type {
  PresswallConfig,
  PublisherCatalogItem,
  ShopCustomLogo,
  ShopPublisherSelection,
  StorefrontPayload,
} from "@/lib/presswall-types";
import { resolveStorefrontPublishers } from "@/lib/resolve-storefront-publishers";
import { bootstrapShopBanners } from "@/lib/shop-banner-bootstrap";

export function buildStorefrontPayload(
  config: PresswallConfig,
  selections: ShopPublisherSelection[],
  catalog: PublisherCatalogItem[],
  options?: { customLogos?: ShopCustomLogo[] }
): StorefrontPayload {
  const hydratedSelections = options?.customLogos
    ? hydrateBannerSelections(selections, options.customLogos)
    : selections;

  return {
    ...config,
    publishers: resolveStorefrontPublishers(catalog, hydratedSelections, {
      ...options,
      absoluteLogoUrls: true,
      colorMode: config.colorMode,
    }),
  };
}

/**
 * Always returns the shop's single canonical banner design.
 * Page context (homepage / product / product id) is ignored.
 */
export async function getResolvedStorefrontPayload(
  shop: string,
  catalog: PublisherCatalogItem[],
  _context?: unknown
): Promise<StorefrontPayload> {
  const [bootstrap, customLogos] = await Promise.all([
    bootstrapShopBanners(shop),
    getShopCustomLogos(shop),
  ]);

  const payloadOptions = { customLogos };
  const banner = pickCanonicalShopBanner(bootstrap.banners);

  if (banner) {
    return buildStorefrontPayload(
      banner.config,
      banner.selections,
      catalog,
      payloadOptions
    );
  }

  return buildStorefrontPayload(
    DEFAULT_PRESSWALL_CONFIG,
    [],
    catalog,
    payloadOptions
  );
}
