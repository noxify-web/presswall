/**
 * @deprecated Import from `@/lib/banner-service` instead.
 * Kept so existing imports keep working during migration.
 */
import {
  createShopBanner,
  getShopBannerById,
  listShopBanners,
  type ShopBanner,
} from "@/lib/banner-service";

export type ShopCustomTemplate = ShopBanner;

export const listShopCustomTemplates = listShopBanners;
export const getShopCustomTemplateById = getShopBannerById;
export const saveShopCustomTemplate = createShopBanner;
