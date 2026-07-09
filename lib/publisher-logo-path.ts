import { getAppUrl } from "@/lib/app-url";
import {
  type LogoVariant,
  logoVariantForColorMode,
  parseLogoVariant,
} from "@/lib/logo-variant";

const TRAILING_SLASH = /\/$/;

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
  return "black";
}

/** Bundled logo URL — variant selected via query string. */
export function bundledLogoPath(
  publisherId: string,
  options?: BundledLogoPathOptions
): string {
  const variant = resolveVariant(options);
  return `/api/publishers/${publisherId}/logo?variant=${variant}`;
}

export function absoluteBundledLogoUrl(
  publisherId: string,
  options?: BundledLogoPathOptions
): string {
  const appOrigin = getAppUrl().replace(TRAILING_SLASH, "");
  return `${appOrigin}${bundledLogoPath(publisherId, options)}`;
}
