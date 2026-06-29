import { asc, eq, inArray } from "drizzle-orm";
import { isBundledPublisherId } from "@/lib/bundled-publishers";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import type {
  PresswallConfig,
  PublisherCatalogItem,
  ShopPublisherSelection,
  StorefrontPayload,
} from "@/lib/presswall-types";
import { presswallConfigSchema } from "@/lib/presswall-types";
import { getSeedPublishers } from "@/lib/publishers-seed";
import { resolveStorefrontPublishers } from "@/lib/resolve-storefront-publishers";
import { sanitizeSvg } from "@/lib/svg-sanitize";
import { db } from "@/src/db";
import { publishers, shopConfigs, shopPublishers } from "@/src/db/schema";

let seedPromise: Promise<void> | null = null;

export async function ensurePublisherCatalogSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const seed = getSeedPublishers();
      const seedIds = seed.map((publisher) => publisher.id);
      const existingRows = await db
        .select({ id: publishers.id })
        .from(publishers)
        .where(inArray(publishers.id, seedIds));
      const existingIds = new Set(existingRows.map((row) => row.id));
      const missing = seed.filter(
        (publisher) => !existingIds.has(publisher.id)
      );

      if (missing.length === 0) {
        return;
      }

      await db.insert(publishers).values(missing);
    })().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }

  await seedPromise;
}

function mapConfigRow(
  row: typeof shopConfigs.$inferSelect | undefined
): PresswallConfig {
  if (!row) {
    return DEFAULT_PRESSWALL_CONFIG;
  }

  const parsed = presswallConfigSchema.safeParse({
    headingText: row.headingText,
    showHeading: row.showHeading,
    colorMode: row.colorMode,
    layout: row.layout,
    logoHeight: row.logoHeight,
    gap: row.gap,
    alignment: row.alignment,
    backgroundColor: row.backgroundColor,
    textColor: row.textColor,
    borderRadius: row.borderRadius,
    paddingY: row.paddingY,
    paddingX: row.paddingX,
    marqueeSpeed: row.marqueeSpeed,
    grayscaleOpacity: row.grayscaleOpacity,
  });

  return parsed.success ? parsed.data : DEFAULT_PRESSWALL_CONFIG;
}

function buildConfigRow(shop: string, config: PresswallConfig, now: string) {
  return {
    shop,
    headingText: config.headingText,
    showHeading: config.showHeading,
    colorMode: config.colorMode,
    layout: config.layout,
    logoHeight: config.logoHeight,
    gap: config.gap,
    alignment: config.alignment,
    backgroundColor: config.backgroundColor,
    textColor: config.textColor,
    borderRadius: config.borderRadius,
    paddingY: config.paddingY,
    paddingX: config.paddingX,
    marqueeSpeed: config.marqueeSpeed,
    grayscaleOpacity: config.grayscaleOpacity,
    updatedAt: now,
  };
}

function sanitizeSelections(
  selections: ShopPublisherSelection[]
): ShopPublisherSelection[] {
  return selections.map((selection) => ({
    ...selection,
    customName: selection.customName?.trim(),
    customLogoSvg: selection.customLogoSvg
      ? sanitizeSvg(selection.customLogoSvg)
      : selection.customLogoSvg,
  }));
}

export async function getPublisherCatalog(): Promise<PublisherCatalogItem[]> {
  await ensurePublisherCatalogSeeded();
  const rows = await db
    .select()
    .from(publishers)
    .orderBy(asc(publishers.sortOrder), asc(publishers.name));

  return rows
    .filter((row) => isBundledPublisherId(row.id))
    .map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      logoSvg: row.logoSvg,
      logoMonoSvg: row.logoMonoSvg,
      websiteUrl: row.websiteUrl,
    }));
}

export async function getShopConfigRow(shop: string) {
  const rows = await db
    .select()
    .from(shopConfigs)
    .where(eq(shopConfigs.shop, shop))
    .limit(1);

  return rows[0];
}

export async function getShopConfig(shop: string): Promise<PresswallConfig> {
  return mapConfigRow(await getShopConfigRow(shop));
}

export async function needsOnboarding(shop: string): Promise<boolean> {
  const [configRow, selections] = await Promise.all([
    getShopConfigRow(shop),
    getShopPublisherSelections(shop),
  ]);

  if (configRow?.onboardingCompletedAt) {
    return false;
  }

  return selections.length === 0;
}

export async function getShopPublisherSelections(
  shop: string
): Promise<ShopPublisherSelection[]> {
  const rows = await db
    .select()
    .from(shopPublishers)
    .where(eq(shopPublishers.shop, shop))
    .orderBy(asc(shopPublishers.position));

  return rows.map((row) => ({
    publisherId: row.publisherId ?? undefined,
    customName: row.customName ?? undefined,
    customLogoSvg: row.customLogoSvg ?? undefined,
    customUrl: row.customUrl ?? undefined,
    position: row.position,
  }));
}

export async function saveShopPresswall(
  shop: string,
  config: PresswallConfig,
  selections: ShopPublisherSelection[],
  options?: { completeOnboarding?: boolean }
): Promise<void> {
  const now = new Date().toISOString();
  const configRow = {
    ...buildConfigRow(shop, config, now),
    ...(options?.completeOnboarding ? { onboardingCompletedAt: now } : {}),
  };
  const sanitizedSelections = sanitizeSelections(selections);

  await db.transaction(async (tx) => {
    await tx
      .insert(shopConfigs)
      .values(configRow)
      .onConflictDoUpdate({
        target: shopConfigs.shop,
        set: {
          ...configRow,
          ...(options?.completeOnboarding
            ? { onboardingCompletedAt: now }
            : {}),
        },
      });

    await tx.delete(shopPublishers).where(eq(shopPublishers.shop, shop));

    if (sanitizedSelections.length > 0) {
      await tx.insert(shopPublishers).values(
        sanitizedSelections.map((selection, index) => ({
          shop,
          publisherId: selection.publisherId ?? null,
          customName: selection.customName ?? null,
          customLogoSvg: selection.customLogoSvg ?? null,
          customUrl: selection.customUrl || null,
          position: selection.position ?? index,
        }))
      );
    }
  });
}

export async function getStorefrontPayload(
  shop: string
): Promise<StorefrontPayload> {
  await ensurePublisherCatalogSeeded();

  const [config, selections, catalog] = await Promise.all([
    getShopConfig(shop),
    getShopPublisherSelections(shop),
    getPublisherCatalog(),
  ]);

  return {
    ...config,
    publishers: resolveStorefrontPublishers(config, catalog, selections),
  };
}
