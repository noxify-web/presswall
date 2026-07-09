import { isTransparentBackground } from "@/lib/presswall-preview-colors";
import type { PresswallConfig } from "@/lib/presswall-types";

const DARK_BACKGROUND_LUMINANCE_THRESHOLD = 0.4;
const HEX_PREFIX_PATTERN = /^#/;
const HEX_COLOR_PATTERN = /^[0-9a-f]{3}([0-9a-f]{3})?$/i;
const RGB_COLOR_PATTERN =
  /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;

function channelToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.039_28
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(red: number, green: number, blue: number): number {
  const linearRed = channelToLinear(red);
  const linearGreen = channelToLinear(green);
  const linearBlue = channelToLinear(blue);
  return 0.2126 * linearRed + 0.7152 * linearGreen + 0.0722 * linearBlue;
}

function parseHexColor(color: string): [number, number, number] | null {
  const hex = color.trim().replace(HEX_PREFIX_PATTERN, "");
  if (!HEX_COLOR_PATTERN.test(hex)) {
    return null;
  }

  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex;

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function parseRgbColor(color: string): [number, number, number] | null {
  const match = color.trim().match(RGB_COLOR_PATTERN);

  if (!match) {
    return null;
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function isDarkBackgroundColor(backgroundColor: string): boolean {
  const candidate = backgroundColor.trim().toLowerCase();
  if (isTransparentBackground(candidate)) {
    return false;
  }

  const rgb =
    candidate.startsWith("#") && candidate.length <= 9
      ? parseHexColor(candidate)
      : parseRgbColor(candidate);

  if (!rgb) {
    return false;
  }

  return relativeLuminance(...rgb) < DARK_BACKGROUND_LUMINANCE_THRESHOLD;
}

interface LogoContrastOptions {
  previewIsDark?: boolean;
}

/**
 * Whether storefront should flip logos via CSS invert.
 * With dedicated black/white assets, invert is never needed for normal modes.
 * Kept only for rare clients that still force invertLogos via metafield.
 */
export function shouldInvertLogos(
  _config: PresswallConfig,
  _options: LogoContrastOptions = {}
): boolean {
  // Pure black/white assets — never invert via CSS.
  // Merchants pick white vs black (or color) explicitly.
  return false;
}
