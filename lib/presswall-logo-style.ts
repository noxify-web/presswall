import { normalizeColorMode } from "@/lib/logo-variant";
import type { PresswallConfig } from "@/lib/presswall-types";

interface LogoImageStyleOptions {
  previewIsDark?: boolean;
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
