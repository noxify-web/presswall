import type { BannerPageContext } from "@/lib/banner-page-context";
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
import {
  findBannerById,
  resolveBannerIdForContext,
} from "@/lib/resolve-banner-for-context";
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

export async function getResolvedStorefrontPayload(
  shop: string,
  catalog: PublisherCatalogItem[],
  context: BannerPageContext | null
): Promise<StorefrontPayload> {
  const [bootstrap, customLogos] = await Promise.all([
    bootstrapShopBanners(shop),
    getShopCustomLogos(shop),
  ]);

  const { defaultBannerId, banners, assignments } = bootstrap;

  const bannerRecords = banners.map((banner) => ({
    id: banner.id,
    name: banner.name,
    config: banner.config,
    selections: banner.selections,
    isDefault: banner.isDefault,
  }));

  const resolvedBannerId = resolveBannerIdForContext(
    assignments.map((assignment) => ({
      target: assignment.target,
      bannerId: assignment.bannerId,
    })),
    context,
    defaultBannerId
  );

  const payloadOptions = { customLogos };

  const banner = findBannerById(bannerRecords, resolvedBannerId);
  if (banner) {
    return buildStorefrontPayload(
      banner.config,
      banner.selections,
      catalog,
      payloadOptions
    );
  }

  const fallback =
    bannerRecords.find((entry) => entry.isDefault) ?? bannerRecords[0];
  if (fallback) {
    return buildStorefrontPayload(
      fallback.config,
      fallback.selections,
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
