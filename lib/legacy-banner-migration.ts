import { and, asc, eq } from "drizzle-orm";
import { normalizePresswallLayout } from "@/lib/normalize-presswall-layout";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import type { ShopPublisherSelection } from "@/lib/presswall-types";
import { presswallConfigSchema } from "@/lib/presswall-types";
import { db } from "@/src/db";
import {
  shopBannerAssignments,
  shopConfigs,
  shopCustomTemplates,
  shopPublishers,
} from "@/src/db/schema";

const DEFAULT_BANNER_NAME = "Default";

function mapLegacyConfig(row: typeof shopConfigs.$inferSelect | undefined) {
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

async function getLegacySelections(
  shop: string
): Promise<ShopPublisherSelection[]> {
  const rows = await db
    .select()
    .from(shopPublishers)
    .where(eq(shopPublishers.shop, shop))
    .orderBy(asc(shopPublishers.position));

  return rows.map((row) => ({
    publisherId: row.publisherId ?? undefined,
    customLogoId: row.customLogoId ?? undefined,
    customName: row.customName ?? undefined,
    customLogoSvg: row.customLogoSvg ?? undefined,
    customUrl: row.customUrl ?? undefined,
    position: row.position,
  }));
}

export async function ensureLegacyBannerMigrated(
  shop: string
): Promise<string | null> {
  const existingBanners = await db
    .select({
      id: shopCustomTemplates.id,
      isDefault: shopCustomTemplates.isDefault,
    })
    .from(shopCustomTemplates)
    .where(eq(shopCustomTemplates.shop, shop));

  const defaultBanner = existingBanners.find((row) => row.isDefault);
  if (defaultBanner?.id) {
    return defaultBanner.id;
  }

  if (existingBanners.length > 0) {
    return existingBanners[0]?.id ?? null;
  }

  const configRows = await db
    .select()
    .from(shopConfigs)
    .where(eq(shopConfigs.shop, shop))
    .limit(1);

  const config = mapLegacyConfig(configRows[0]);
  const selections = await getLegacySelections(shop);
  const now = new Date().toISOString();
  const bannerId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(shopCustomTemplates).values({
      id: bannerId,
      shop,
      name: DEFAULT_BANNER_NAME,
      description: "Migrated from your original Presswall configuration.",
      configJson: JSON.stringify(config),
      selectionsJson: JSON.stringify(selections),
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });

    const assignmentTargets = ["homepage", "all_products"] as const;
    for (const target of assignmentTargets) {
      await tx.insert(shopBannerAssignments).values({
        id: crypto.randomUUID(),
        shop,
        target,
        bannerId,
        updatedAt: now,
      });
    }
  });

  return bannerId;
}

export async function syncDefaultBannerFromEditor(
  shop: string,
  configJson: string,
  selectionsJson: string
): Promise<void> {
  const defaultBanner = await db
    .select({ id: shopCustomTemplates.id })
    .from(shopCustomTemplates)
    .where(
      and(
        eq(shopCustomTemplates.shop, shop),
        eq(shopCustomTemplates.isDefault, true)
      )
    )
    .limit(1);

  if (!defaultBanner[0]?.id) {
    return;
  }

  const now = new Date().toISOString();
  await db
    .update(shopCustomTemplates)
    .set({
      configJson,
      selectionsJson,
      updatedAt: now,
    })
    .where(eq(shopCustomTemplates.id, defaultBanner[0].id));
}
