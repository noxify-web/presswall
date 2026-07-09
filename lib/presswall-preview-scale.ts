import { getStorefrontLogoMaxWidth } from "@/lib/presswall-logo-style";
import { scaleSpacingForPreview } from "@/lib/presswall-spacing";
import type { PresswallConfig } from "@/lib/presswall-types";

/** ~25% smaller than the previous template thumbnail caps. */
export const TEMPLATE_THUMBNAIL_LOGO_HEIGHT_CAP = 12;
export const TEMPLATE_THUMBNAIL_PADDING_CAP = 9;

/** Preview logo height — live uses config; thumbnails scale down proportionally. */
export function getPreviewLogoHeight(
  configLogoHeight: number,
  scale: "sm" | "md" | "lg",
  isLivePreview: boolean
): number {
  if (isLivePreview) {
    return configLogoHeight;
  }

  if (scale === "sm") {
    return Math.min(configLogoHeight, TEMPLATE_THUMBNAIL_LOGO_HEIGHT_CAP);
  }

  return Math.min(configLogoHeight, 16);
}

/**
 * Gap used in admin previews so thumbnails keep proportional spacing vs full
 * config (storefront parity when logos are scaled down).
 */
export function getPreviewLogoGap(
  config: Pick<PresswallConfig, "gap" | "logoHeight">,
  previewLogoHeight: number,
  isLivePreview: boolean
): number {
  if (isLivePreview) {
    return config.gap;
  }

  return scaleSpacingForPreview(
    config.gap,
    config.logoHeight,
    previewLogoHeight
  );
}

/** Logo max-width for a given rendered preview height (3× storefront rule). */
export function getPreviewLogoMaxWidth(previewLogoHeight: number): number {
  return getStorefrontLogoMaxWidth(previewLogoHeight);
}
