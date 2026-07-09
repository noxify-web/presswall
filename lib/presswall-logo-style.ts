import { normalizeColorMode } from "@/lib/logo-variant";
import type { PresswallConfig } from "@/lib/presswall-types";

interface LogoImageStyleOptions {
  previewIsDark?: boolean;
}

/**
 * Max logo width as a multiple of logo height.
 * Long wordmarks (Economist, WSJ, FT) are often 6–12× as wide as tall; a
 * tight 3× cap forced those marks to shrink below the shared strip height.
 * 12× lets essentially the full catalog render at equal height while still
 * bounding pathological SVGs. Bar templates use space-between so extra width
 * is absorbed as spacing, not equal fixed gaps.
 */
export const STOREFRONT_LOGO_MAX_WIDTH_RATIO = 12;

/**
 * Cap logo width relative to rendered height — same rule as theme CSS
 * (`max-width: calc(var(--presswall-logo-height) * N)`).
 */
export function getStorefrontLogoMaxWidth(logoHeight: number): number {
  if (logoHeight <= 0) {
    return 0;
  }

  return Math.round(logoHeight * STOREFRONT_LOGO_MAX_WIDTH_RATIO);
}

/**
 * CSS applied on top of pre-rendered variant assets.
 * Black / white / color modes use pure assets — no invert/grayscale filters
 * (those caused uneven ink intensity across outlets).
 * Muted mode only dims opacity on black assets.
 */
export function getLogoImageStyle(
  config: PresswallConfig,
  _options: LogoImageStyleOptions = {}
): React.CSSProperties | undefined {
  const mode = normalizeColorMode(config.colorMode);

  if (mode === "muted") {
    return {
      opacity: config.grayscaleOpacity / 100,
    };
  }

  return;
}

export function getLogoSlotStyle(
  logoHeight: number,
  maxWidth: number,
  logoStyle?: React.CSSProperties
): React.CSSProperties {
  return {
    ...logoStyle,
    "--logo-height": `${logoHeight}px`,
    "--logo-max-width": `${maxWidth}px`,
  } as React.CSSProperties;
}
