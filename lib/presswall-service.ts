import { asc, eq, inArray } from "drizzle-orm";
import type { BannerPageContext } from "@/lib/banner-page-context";
import {
  buildStorefrontPayload,
  getResolvedStorefrontPayload,
} from "@/lib/build-storefront-payload";
import { isBundledPublisherId } from "@/lib/bundled-publishers";
import { isPendingCustomLogoId } from "@/lib/custom-logo-pending";
import {
  getShopCustomLogos,
  syncShopCustomLogosInTransaction,
} from "@/lib/custom-logo-service";
import { syncDefaultBannerFromEditor } from "@/lib/legacy-banner-migration";
import { normalizePresswallLayout } from "@/lib/normalize-presswall-layout";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import type {
  CustomLogoSaveInput,
  PresswallConfig,
  PublisherCatalogItem,
  ShopCustomLogo,
  ShopPublisherSelection,
  StorefrontPayload,
} from "@/lib/presswall-types";
import { presswallConfigSchema } from "@/lib/presswall-types";
import { getSeedPublishers } from "@/lib/publishers-seed";
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

function buildConfigRow(shop: string, config: PresswallConfig, now: string) {
  return {
    shop,
    headingText: config.headingText,
    showHeading: config.showHeading,
    headingFontSize: config.headingFontSize,
    headingSpacing: config.headingSpacing,
    colorMode: config.colorMode,
    layout: normalizePresswallLayout(config.layout),
    logoHeight: config.logoHeight,
    logosPerRowDesktop: config.logosPerRowDesktop,
    logosPerRowMobile: config.logosPerRowMobile,
    gap: config.gap,
    logoSpacing: config.logoSpacing,
    headingAlignment: config.headingAlignment,
    logoAlignment: config.logoAlignment,
    backgroundColor: config.backgroundColor,
    textColor: config.textColor,
    borderRadius: config.borderRadius,
    paddingY: config.paddingY,
    paddingX: config.paddingX,
    contentMaxWidth: config.contentMaxWidth,
    marqueeSpeed: config.marqueeSpeed,
    grayscaleOpacity: config.grayscaleOpacity,
    updatedAt: now,
  };
}

function remapSelectionLogoIds(
  selections: ShopPublisherSelection[],
  idMap: Map<string, string>
): ShopPublisherSelection[] {
  return selections.map((selection) => {
    if (!(selection.customLogoId && idMap.has(selection.customLogoId))) {
      return selection;
    }

    return {
      ...selection,
      customLogoId: idMap.get(selection.customLogoId),
    };
  });
}

function assertResolvableCustomSelections(
  selections: ShopPublisherSelection[],
  libraryById: Map<string, ShopCustomLogo>
): ShopPublisherSelection[] {
  return selections.map((selection) => {
    if (selection.publisherId) {
      return selection;
    }

    if (selection.customLogoId) {
      if (isPendingCustomLogoId(selection.customLogoId)) {
        throw new Error("Custom logo changes must be saved before selection");
      }

      if (!libraryById.has(selection.customLogoId)) {
        throw new Error("Custom outlet logo is missing from the library");
      }

      return selection;
    }

    const customName = selection.customName?.trim();
    const customLogoSvg = selection.customLogoSvg
      ? sanitizeSvg(selection.customLogoSvg)
      : selection.customLogoSvg;

    if (customName && !customLogoSvg?.trim()) {
      throw new Error("Custom outlet logo is invalid after sanitization");
    }

    return {
      ...selection,
      customName,
      customLogoSvg,
    };
  });
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
  const configRow = await getShopConfigRow(shop);

  return !configRow?.onboardingCompletedAt;
}

export async function getShopPublisherSelections(
  shop: string
): Promise<ShopPublisherSelection[]> {
  const [rows, library] = await Promise.all([
    db
      .select()
      .from(shopPublishers)
      .where(eq(shopPublishers.shop, shop))
      .orderBy(asc(shopPublishers.position)),
    getShopCustomLogos(shop),
  ]);
  const libraryById = new Map(library.map((logo) => [logo.id, logo]));

  return rows.map((row) => {
    const libraryLogo = row.customLogoId
      ? libraryById.get(row.customLogoId)
      : undefined;

    return {
      publisherId: row.publisherId ?? undefined,
      customLogoId: row.customLogoId ?? undefined,
      customName: libraryLogo?.name ?? row.customName ?? undefined,
      customLogoSvg: libraryLogo?.logoSvg ?? row.customLogoSvg ?? undefined,
      customUrl: row.customUrl ?? undefined,
      position: row.position,
    };
  });
}

export interface SaveShopPresswallResult {
  customLogos: ShopCustomLogo[];
  selections: ShopPublisherSelection[];
}

export async function saveShopPresswall(
  shop: string,
  config: PresswallConfig,
  selections: ShopPublisherSelection[],
  options?: {
    completeOnboarding?: boolean;
    customLogos?: CustomLogoSaveInput[];
  }
): Promise<SaveShopPresswallResult> {
  const now = new Date().toISOString();
  const configRow = {
    ...buildConfigRow(shop, config, now),
    ...(options?.completeOnboarding ? { onboardingCompletedAt: now } : {}),
  };

  let syncedLogos = await getShopCustomLogos(shop);

  await db.transaction(async (tx) => {
    const syncResult = options?.customLogos
      ? await syncShopCustomLogosInTransaction(tx, shop, options.customLogos)
      : { idMap: new Map<string, string>(), logos: syncedLogos };

    syncedLogos = syncResult.logos;

    const libraryById = new Map(syncedLogos.map((logo) => [logo.id, logo]));
    const remappedSelections = remapSelectionLogoIds(
      selections,
      syncResult.idMap
    );
    const validatedSelections = assertResolvableCustomSelections(
      remappedSelections,
      libraryById
    );

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

    if (validatedSelections.length > 0) {
      await tx.insert(shopPublishers).values(
        validatedSelections.map((selection, index) => ({
          shop,
          publisherId: selection.publisherId ?? null,
          customLogoId: selection.customLogoId ?? null,
          customName: selection.customLogoId
            ? null
            : (selection.customName ?? null),
          customLogoSvg: selection.customLogoId
            ? null
            : (selection.customLogoSvg ?? null),
          customUrl: selection.customUrl || null,
          position: selection.position ?? index,
        }))
      );
    }
  });

  const hydratedSelections = await getShopPublisherSelections(shop);

  await syncDefaultBannerFromEditor(
    shop,
    JSON.stringify(config),
    JSON.stringify(hydratedSelections)
  );

  return {
    customLogos: syncedLogos,
    selections: hydratedSelections,
  };
}

export async function getStorefrontPayload(
  shop: string,
  context?: BannerPageContext | null
): Promise<StorefrontPayload> {
  await ensurePublisherCatalogSeeded();

  const catalog = await getPublisherCatalog();

  if (context === undefined) {
    const [config, selections] = await Promise.all([
      getShopConfig(shop),
      getShopPublisherSelections(shop),
    ]);

    return buildStorefrontPayload(config, selections, catalog);
  }

  return getResolvedStorefrontPayload(shop, catalog, context);
}
