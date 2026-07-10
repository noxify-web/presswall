/**
 * Single live design per shop.
 *
 * Rule (applied everywhere — admin load/save and storefront):
 * 1. Prefer the banner marked `isDefault`
 * 2. Else most recently updated
 * 3. Else first entry
 *
 * Page context and assignment rows are ignored.
 */

export interface CanonicalBannerLike {
  id: string;
  isDefault: boolean;
  updatedAt: string;
}

export function pickCanonicalShopBanner<T extends CanonicalBannerLike>(
  banners: readonly T[]
): T | null {
  if (banners.length === 0) {
    return null;
  }

  const defaultBanner = banners.find((banner) => banner.isDefault);
  if (defaultBanner) {
    return defaultBanner;
  }

  const sorted = [...banners].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );

  return sorted[0] ?? null;
}

export function pickCanonicalShopBannerId(
  banners: readonly CanonicalBannerLike[]
): string | null {
  return pickCanonicalShopBanner(banners)?.id ?? null;
}
