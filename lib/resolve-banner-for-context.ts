import type { BannerPageContext } from "@/lib/banner-page-context";
import { formatProductAssignmentTarget } from "@/lib/banner-page-context";
import type {
  PresswallConfig,
  ShopPublisherSelection,
} from "@/lib/presswall-types";

export type BannerAssignmentTarget =
  | "homepage"
  | "all_products"
  | `product:${string}`;

export interface ShopBannerRecord {
  config: PresswallConfig;
  id: string;
  isDefault: boolean;
  name: string;
  selections: ShopPublisherSelection[];
}

export interface BannerAssignmentRecord {
  bannerId: string;
  target: BannerAssignmentTarget;
}

export function resolveBannerIdForContext(
  assignments: BannerAssignmentRecord[],
  context: BannerPageContext | null,
  defaultBannerId: string | null
): string | null {
  const byTarget = new Map(
    assignments.map((assignment) => [assignment.target, assignment.bannerId])
  );

  if (context?.pageType === "product" && context.productId) {
    const specificTarget = formatProductAssignmentTarget(
      context.productId
    ) as BannerAssignmentTarget;
    const specificBannerId = byTarget.get(specificTarget);
    if (specificBannerId) {
      return specificBannerId;
    }
  }

  if (context?.pageType === "homepage") {
    const homepageBannerId = byTarget.get("homepage");
    if (homepageBannerId) {
      return homepageBannerId;
    }
  }

  if (context?.pageType === "product") {
    const productDefaultBannerId = byTarget.get("all_products");
    if (productDefaultBannerId) {
      return productDefaultBannerId;
    }
  }

  if (!context) {
    const homepageBannerId = byTarget.get("homepage");
    if (homepageBannerId) {
      return homepageBannerId;
    }

    const productDefaultBannerId = byTarget.get("all_products");
    if (productDefaultBannerId) {
      return productDefaultBannerId;
    }
  }

  return defaultBannerId;
}

export function findBannerById(
  banners: ShopBannerRecord[],
  bannerId: string | null
): ShopBannerRecord | null {
  if (!bannerId) {
    return null;
  }

  return banners.find((banner) => banner.id === bannerId) ?? null;
}
