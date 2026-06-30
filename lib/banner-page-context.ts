import { z } from "zod";

const PRODUCT_GID_PATTERN = /Product\/(\d+)/i;
const NUMERIC_ID_PATTERN = /^\d+$/;

export const bannerPageTypeSchema = z.enum(["homepage", "product"]);
export type BannerPageType = z.infer<typeof bannerPageTypeSchema>;

export interface BannerPageContext {
  pageType: BannerPageType;
  productId?: string;
}

export function parseBannerPageContext(
  searchParams: URLSearchParams
): BannerPageContext | null {
  const pageTypeRaw = searchParams.get("page_type")?.trim().toLowerCase();

  if (pageTypeRaw === "homepage" || pageTypeRaw === "index") {
    return { pageType: "homepage" };
  }

  if (pageTypeRaw === "product") {
    const productId = normalizeProductId(searchParams.get("product_id"));
    return productId
      ? { pageType: "product", productId }
      : { pageType: "product" };
  }

  const template = searchParams.get("template")?.trim().toLowerCase();
  if (template === "index") {
    return { pageType: "homepage" };
  }

  if (template === "product") {
    const productId = normalizeProductId(searchParams.get("product_id"));
    return productId
      ? { pageType: "product", productId }
      : { pageType: "product" };
  }

  return null;
}

export function normalizeProductId(
  value: string | null | undefined
): string | undefined {
  if (!value?.trim()) {
    return;
  }

  const trimmed = value.trim();
  const gidMatch = trimmed.match(PRODUCT_GID_PATTERN);
  if (gidMatch?.[1]) {
    return gidMatch[1];
  }

  if (NUMERIC_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  return;
}

export function formatProductAssignmentTarget(productId: string): string {
  return `product:${normalizeProductId(productId) ?? productId}`;
}
