/**
 * Logo color treatment for bundled press outlets.
 *
 * Merchants pick strip-level colorMode; we map that to an on-disk variant
 * (color / black / white PNGs with a shared alpha mask for mono modes).
 */

import { z } from "zod";

/** On-disk / API logo variants. */
export const LOGO_VARIANTS = ["color", "black", "white"] as const;
export type LogoVariant = (typeof LOGO_VARIANTS)[number];

export const logoVariantSchema = z.enum(LOGO_VARIANTS);

/**
 * Product color modes.
 * - `color` — full-color marks (mono-only brands fall back to black art)
 * - `black` — pure black silhouettes
 * - `white` — pure white silhouettes
 * - `muted` — black silhouettes with reduced opacity (legacy look)
 * - `mono` — legacy alias: black on light/transparent, white on dark backgrounds
 */
export const COLOR_MODES = [
  "color",
  "black",
  "white",
  "muted",
  "mono",
] as const;
export type ColorMode = (typeof COLOR_MODES)[number];

/** Modes merchants can pick in the UI (legacy `mono` still parses). */
export const PRIMARY_COLOR_MODES = [
  "color",
  "black",
  "white",
  "muted",
] as const;
export type PrimaryColorMode = (typeof PRIMARY_COLOR_MODES)[number];

/**
 * Normalize a standalone colorMode value (no background context).
 * Legacy `mono` → `black`. Prefer {@link migrateLegacyColorMode} when
 * background darkness is known (mono + dark band → white).
 */
export function normalizeColorMode(mode: ColorMode | string): PrimaryColorMode {
  if (mode === "mono") {
    return "black";
  }
  if (
    mode === "color" ||
    mode === "black" ||
    mode === "white" ||
    mode === "muted"
  ) {
    return mode;
  }
  return "black";
}

/**
 * Migrate saved colorMode values using strip background luminance.
 * Legacy `mono` on a dark background used CSS invert → white silhouettes;
 * map that to explicit `white` so pure assets stay visible without invert.
 *
 * @param isDarkBackground - from {@link isDarkBackgroundColor}
 */
export function migrateLegacyColorMode(
  mode: ColorMode | string,
  isDarkBackground: boolean
): PrimaryColorMode {
  if (mode === "mono" && isDarkBackground) {
    return "white";
  }
  return normalizeColorMode(mode);
}

/** Raw enum (keeps `mono` so full-config migration can still see it). */
export const rawColorModeSchema = z.enum(COLOR_MODES);

/**
 * Standalone schema: accepts legacy `mono` and collapses to `black`.
 * Full banner configs use {@link migrateLegacyColorMode} via presswallConfigSchema.
 */
export const colorModeSchema = rawColorModeSchema.transform(
  (mode): PrimaryColorMode => normalizeColorMode(mode)
);

/** Which asset variant to serve for a colorMode (already migrated preferred). */
export function logoVariantForColorMode(mode: ColorMode | string): LogoVariant {
  const normalized = normalizeColorMode(mode);
  if (normalized === "color") {
    return "color";
  }
  if (normalized === "white") {
    return "white";
  }
  // black + muted use pure black assets
  return "black";
}

export function isLogoVariant(value: string): value is LogoVariant {
  return (LOGO_VARIANTS as readonly string[]).includes(value);
}

export function parseLogoVariant(
  value: string | null | undefined,
  fallback: LogoVariant = "black"
): LogoVariant {
  if (!value) {
    return fallback;
  }
  const trimmed = value.trim().toLowerCase();
  return isLogoVariant(trimmed) ? trimmed : fallback;
}
