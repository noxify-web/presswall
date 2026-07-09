import type { PresswallConfig } from "@/lib/presswall-types";

const LOGO_GAP_PER_LOGO_HEIGHT = 1.125;
const HEADING_SPACING_PER_FONT_SIZE = 10 / 3;

const LAYOUT_GAP_MULTIPLIER: Record<PresswallConfig["layout"], number> = {
  bar: 1,
  marquee: 1,
};

function roundToStep(value: number, step = 2): number {
  return Math.round(value / step) * step;
}

function clampSpacing(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, roundToStep(value)));
}

export function deriveLogoGap(
  logoHeight: number,
  layout: PresswallConfig["layout"] = "bar"
): number {
  const raw =
    logoHeight * LOGO_GAP_PER_LOGO_HEIGHT * LAYOUT_GAP_MULTIPLIER[layout];

  return clampSpacing(raw, 8, 64);
}

export function deriveHeadingSpacing(headingFontSize: number): number {
  const raw = headingFontSize * HEADING_SPACING_PER_FONT_SIZE;

  return clampSpacing(raw, 8, 80);
}

export function withDerivedSpacing(config: PresswallConfig): PresswallConfig {
  return {
    ...config,
    gap: deriveLogoGap(config.logoHeight, config.layout),
    headingSpacing: deriveHeadingSpacing(config.headingFontSize),
  };
}

export function applyDerivedSpacingPatch(
  config: PresswallConfig,
  key: keyof PresswallConfig
): Partial<PresswallConfig> {
  if (key === "logoHeight" || key === "layout") {
    const patch: Partial<PresswallConfig> = {
      gap: deriveLogoGap(config.logoHeight, config.layout),
    };

    if (key === "layout" && config.layout === "bar") {
      patch.logoSpacing = "space-between";
    }

    if (key === "layout" && config.layout === "marquee") {
      patch.logoSpacing = "gap";
    }

    return patch;
  }

  if (key === "headingFontSize") {
    return { headingSpacing: deriveHeadingSpacing(config.headingFontSize) };
  }

  return {};
}

/**
 * Scale bar/marquee gap (or other spacing) when admin previews shrink logo height.
 * Keeps gap proportional to the full config so thumbnails do not collapse spacing
 * to zero when logos are capped smaller than the live strip.
 */
export function scaleSpacingForPreview(
  spacing: number,
  configLogoHeight: number,
  previewLogoHeight: number,
  options?: { min?: number }
): number {
  const min = options?.min ?? 2;

  if (spacing <= 0) {
    return 0;
  }

  if (configLogoHeight <= 0 || previewLogoHeight <= 0) {
    return Math.max(min, spacing);
  }

  if (previewLogoHeight >= configLogoHeight) {
    return Math.max(min, spacing);
  }

  const scaled = roundToStep(spacing * (previewLogoHeight / configLogoHeight));

  return Math.max(min, scaled);
}
