import {
  type LogoVariant,
  logoVariantForColorMode,
  parseLogoVariant,
} from "@/lib/logo-variant";
import { absoluteBundledLogoUrl } from "@/lib/publisher-logo-path";

const TRAILING_SLASH = /\/$/;
const URL_ORIGIN_PREFIX = /^https?:\/\/[^/]+/;

/**
 * Build a storefront logo URL for the shop metafield / liquid fallback.
 *
 * Must preserve the ink variant (white / black / color) from the live payload.
 * Previously dropped `?variant=` and defaulted to color assets — white strips
 * on dark backgrounds looked black on the live storefront.
 */
export function resolveMetafieldLogoUrl(
  shop: string,
  publisherId: string,
  logoImageUrl: string | null,
  options: {
    appUrl: string;
    colorMode?: string | null;
  }
): string | null {
  if (!logoImageUrl) {
    return null;
  }

  // Custom / data URLs pass through unchanged.
  const isBundledLogoPath =
    logoImageUrl.includes("/publishers/") ||
    logoImageUrl.includes("/api/publishers/");
  if (logoImageUrl.startsWith("data:") || !isBundledLogoPath) {
    return logoImageUrl;
  }

  const variant = resolveVariantFromLogoUrl(
    logoImageUrl,
    options.colorMode ?? undefined
  );

  const appUrl = options.appUrl.trim();
  if (appUrl.startsWith("https://")) {
    return absoluteBundledLogoUrl(publisherId, {
      variant,
      // absoluteBundledLogoUrl uses getAppUrl() internally — rewrite via
      // explicit origin so tunnel hosts never stick in production metafields.
    }).replace(URL_ORIGIN_PREFIX, appUrl.replace(TRAILING_SLASH, ""));
  }

  return `https://${shop}/apps/presswall/publishers/${publisherId}/logo?variant=${variant}`;
}

function resolveVariantFromLogoUrl(
  logoImageUrl: string,
  colorMode?: string
): LogoVariant {
  try {
    const parsed = new URL(logoImageUrl, "https://presswall.noxify.io");
    const fromQuery = parsed.searchParams.get("variant");
    if (fromQuery) {
      return parseLogoVariant(fromQuery, "black");
    }
  } catch {
    // fall through
  }

  if (colorMode) {
    return logoVariantForColorMode(colorMode);
  }

  return "black";
}
