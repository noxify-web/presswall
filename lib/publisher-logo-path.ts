import { getPublicAppUrl } from "@/lib/app-url";
import {
  type LogoVariant,
  logoVariantForColorMode,
  parseLogoVariant,
} from "@/lib/logo-variant";

export interface BundledLogoPathOptions {
  /** Strip colorMode — used when variant is not provided. */
  colorMode?: string | null;
  /** Explicit variant; overrides colorMode when set. */
  variant?: LogoVariant | string | null;
}

function resolveVariant(options?: BundledLogoPathOptions): LogoVariant {
  if (options?.variant != null && options.variant !== "") {
    return parseLogoVariant(String(options.variant), "black");
  }
  if (options?.colorMode) {
    return logoVariantForColorMode(options.colorMode);
  }
  // Default to color assets when no mode is specified (library / previews).
  return "color";
}

/** Bundled logo URL — variant selected via query string. */
export function bundledLogoPath(
  publisherId: string,
  options?: BundledLogoPathOptions
): string {
  const variant = resolveVariant(options);
  return `/api/publishers/${publisherId}/logo?variant=${variant}`;
}

/**
 * Absolute logo URL for storefront / metafield payloads.
 * Uses {@link getPublicAppUrl} so local tunnels never leak into the Online Store.
 */
export function absoluteBundledLogoUrl(
  publisherId: string,
  options?: BundledLogoPathOptions
): string {
  return `${getPublicAppUrl()}${bundledLogoPath(publisherId, options)}`;
}
