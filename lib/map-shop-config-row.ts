import { normalizePresswallLayout } from "@/lib/normalize-presswall-layout";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import type { PresswallConfig } from "@/lib/presswall-types";
import { presswallConfigSchema } from "@/lib/presswall-types";
import type { shopConfigs } from "@/src/db/schema";

/** Map a legacy `shop_configs` row into a typed config (bootstrap/migration only). */
export function mapShopConfigRow(
  row: typeof shopConfigs.$inferSelect | undefined
): PresswallConfig {
  if (!row) {
    return DEFAULT_PRESSWALL_CONFIG;
  }

  const layout = normalizePresswallLayout(row.layout);

  const parsed = presswallConfigSchema.safeParse({
    headingText: row.headingText,
    showHeading: row.showHeading,
    headingFontSize:
      row.headingFontSize ?? DEFAULT_PRESSWALL_CONFIG.headingFontSize,
    headingSpacing:
      row.headingSpacing ?? DEFAULT_PRESSWALL_CONFIG.headingSpacing,
    colorMode: row.colorMode,
    layout,
    logoHeight: row.logoHeight,
    logosPerRowDesktop:
      row.logosPerRowDesktop ?? DEFAULT_PRESSWALL_CONFIG.logosPerRowDesktop,
    logosPerRowMobile:
      row.logosPerRowMobile ?? DEFAULT_PRESSWALL_CONFIG.logosPerRowMobile,
    gap: row.gap,
    logoSpacing:
      row.logoSpacing ??
      (layout === "bar"
        ? "space-between"
        : DEFAULT_PRESSWALL_CONFIG.logoSpacing),
    headingAlignment: row.headingAlignment,
    logoAlignment: row.logoAlignment ?? row.headingAlignment,
    backgroundColor: row.backgroundColor,
    textColor: row.textColor,
    borderRadius: row.borderRadius,
    paddingY: row.paddingY,
    paddingX: row.paddingX,
    contentMaxWidth:
      row.contentMaxWidth ?? DEFAULT_PRESSWALL_CONFIG.contentMaxWidth,
    marqueeSpeed: row.marqueeSpeed,
    grayscaleOpacity: row.grayscaleOpacity,
  });

  return parsed.success ? parsed.data : DEFAULT_PRESSWALL_CONFIG;
}
