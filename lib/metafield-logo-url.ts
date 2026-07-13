import {
  getPublicAppUrl,
  isEphemeralAppHost,
  PRODUCTION_APP_URL,
} from "@/lib/app-url";
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
 *
 * Never emits tunnel / localhost hosts: those 404 after local dev ends while
 * the heading text still renders from the metafield.
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

  const preferredOrigin = pickStableAppOrigin(options.appUrl);
  if (preferredOrigin) {
    return absoluteBundledLogoUrl(publisherId, { variant }).replace(
      URL_ORIGIN_PREFIX,
      preferredOrigin
    );
  }

  return `https://${shop}/apps/presswall/publishers/${publisherId}/logo?variant=${variant}`;
}

/** Prefer a non-ephemeral https origin; fall back to production public host. */
function pickStableAppOrigin(appUrl: string): string | null {
  const candidate = appUrl.trim().replace(TRAILING_SLASH, "");
  if (
    candidate.startsWith("https://") &&
    !isEphemeralAppHost(candidate)
  ) {
    return candidate;
  }

  const publicOrigin = getPublicAppUrl();
  if (
    publicOrigin.startsWith("https://") &&
    !isEphemeralAppHost(publicOrigin)
  ) {
    return publicOrigin;
  }

  // Last resort: hard-coded production (never tunnel).
  return PRODUCTION_APP_URL;
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
