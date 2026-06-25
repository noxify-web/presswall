import { z } from "zod";
import {
  cssColorSchema,
  MAX_CUSTOM_LOGO_SVG_LENGTH,
  safeHttpUrlSchema,
} from "@/lib/presswall-validation";

export const colorModeSchema = z.enum(["mono", "color", "muted"]);
export const layoutSchema = z.enum(["bar", "grid", "marquee"]);
export const alignmentSchema = z.enum(["left", "center", "right"]);

export const presswallConfigSchema = z.object({
  headingText: z.string().min(0).max(80),
  showHeading: z.boolean(),
  colorMode: colorModeSchema,
  layout: layoutSchema,
  logoHeight: z.number().int().min(16).max(80),
  gap: z.number().int().min(8).max(64),
  alignment: alignmentSchema,
  backgroundColor: cssColorSchema,
  textColor: cssColorSchema,
  borderRadius: z.number().int().min(0).max(32),
  paddingY: z.number().int().min(0).max(80),
  paddingX: z.number().int().min(0).max(80),
  marqueeSpeed: z.number().int().min(10).max(80),
  grayscaleOpacity: z.number().int().min(20).max(100),
});

export type PresswallConfig = z.infer<typeof presswallConfigSchema>;

export const shopPublisherSelectionSchema = z
  .object({
    publisherId: z.string().optional(),
    customName: z.string().max(120).optional(),
    customLogoSvg: z.string().max(MAX_CUSTOM_LOGO_SVG_LENGTH).optional(),
    customUrl: safeHttpUrlSchema.optional(),
    position: z.number().int(),
  })
  .refine(
    (selection) =>
      Boolean(selection.publisherId) || Boolean(selection.customName?.trim()),
    { message: "Each selection needs a publisher or custom name" }
  );

export type ShopPublisherSelection = z.infer<
  typeof shopPublisherSelectionSchema
>;

export type PublisherCatalogItem = {
  id: string;
  name: string;
  category: string;
  logoSvg: string;
  logoMonoSvg: string;
  websiteUrl: string | null;
};

export type StorefrontPublisher = {
  id: string;
  name: string;
  logoSvg: string;
  url: string | null;
};

export type StorefrontPayload = PresswallConfig & {
  publishers: StorefrontPublisher[];
};
