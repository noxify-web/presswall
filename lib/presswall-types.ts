import { z } from "zod";
import {
  migrateLegacyColorMode,
  rawColorModeSchema,
} from "@/lib/logo-variant";
import { isDarkBackgroundColor } from "@/lib/presswall-logo-contrast";
import { normalizePresswallLayout } from "@/lib/normalize-presswall-layout";
import {
  cssColorSchema,
  MAX_CUSTOM_LOGO_SVG_LENGTH,
  safeHttpUrlSchema,
} from "@/lib/presswall-validation";

export type {
  ColorMode,
  LogoVariant,
  PrimaryColorMode,
} from "@/lib/logo-variant";

export const layoutSchema = z
  .enum(["bar", "grid", "marquee", "slider"])
  .transform(normalizePresswallLayout);
export const alignmentSchema = z.enum(["left", "center", "right"]);
export type PresswallAlignment = z.infer<typeof alignmentSchema>;

export const logoSpacingSchema = z.enum(["gap", "space-between"]);
export type PresswallLogoSpacing = z.infer<typeof logoSpacingSchema>;

/**
 * Full strip config. Legacy `mono` is migrated with background awareness:
 * mono + dark band → white (replaces old CSS invert); mono + light → black.
 */
export const presswallConfigSchema = z
  .object({
    headingText: z.string().min(0).max(80),
    showHeading: z.boolean(),
    headingFontSize: z.number().int().min(10).max(24),
    headingSpacing: z.number().int().min(8).max(80),
    colorMode: rawColorModeSchema,
    layout: layoutSchema,
    logoHeight: z.number().int().min(10).max(80),
    logosPerRowDesktop: z.number().int().min(2).max(8),
    logosPerRowMobile: z.number().int().min(1).max(4),
    gap: z.number().int().min(8).max(64),
    logoSpacing: logoSpacingSchema,
    headingAlignment: alignmentSchema,
    logoAlignment: alignmentSchema,
    backgroundColor: cssColorSchema,
    textColor: cssColorSchema,
    borderRadius: z.number().int().min(0).max(32),
    paddingY: z.number().int().min(0).max(80),
    paddingX: z.number().int().min(0).max(80),
    contentMaxWidth: z.number().int().min(360).max(1200),
    marqueeSpeed: z.number().int().min(10).max(80),
    grayscaleOpacity: z.number().int().min(20).max(100),
  })
  .transform((config) => ({
    ...config,
    colorMode: migrateLegacyColorMode(
      config.colorMode,
      isDarkBackgroundColor(config.backgroundColor)
    ),
  }));

export type PresswallConfig = z.infer<typeof presswallConfigSchema>;

export const shopPublisherSelectionSchema = z
  .object({
    publisherId: z.string().optional(),
    customLogoId: z.string().optional(),
    customName: z.string().max(120).optional(),
    customLogoSvg: z.string().max(MAX_CUSTOM_LOGO_SVG_LENGTH).optional(),
    customUrl: safeHttpUrlSchema.optional(),
    position: z.number().int(),
  })
  .refine(
    (selection) => {
      if (selection.publisherId) {
        return true;
      }

      if (selection.customLogoId?.trim()) {
        return true;
      }

      return (
        Boolean(selection.customName?.trim()) &&
        Boolean(selection.customLogoSvg?.trim())
      );
    },
    {
      message:
        "Each selection needs a bundled publisher, a custom logo id, or a custom name with logo",
    }
  );

export const customLogoSaveSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(120),
  logoSvg: z.string().min(1).max(MAX_CUSTOM_LOGO_SVG_LENGTH),
});

export type CustomLogoSaveInput = z.infer<typeof customLogoSaveSchema>;

export type ShopPublisherSelection = z.infer<
  typeof shopPublisherSelectionSchema
>;

export interface ShopCustomLogo {
  createdAt: string;
  id: string;
  logoSvg: string;
  name: string;
}

export interface SelectedPublisher {
  customLogoId?: string;
  customLogoSvg?: string;
  customName?: string;
  customUrl?: string;
  key: string;
  publisherId?: string;
}

export interface PublisherCatalogItem {
  category: string;
  id: string;
  logoMonoSvg: string;
  logoSvg: string;
  name: string;
  websiteUrl: string | null;
}

export interface StorefrontPublisher {
  id: string;
  isCustom: boolean;
  logoImageUrl: string | null;
  logoSvg: string;
  name: string;
  url: string | null;
}

export type StorefrontPayload = PresswallConfig & {
  invertLogos?: boolean;
  publishers: StorefrontPublisher[];
};
