import { asc, eq, inArray } from "drizzle-orm";
import {
  normalizeSelectionsForStorage,
  updateShopBannerInTransaction,
} from "@/lib/banner-service";
import { getResolvedStorefrontPayload } from "@/lib/build-storefront-payload";
import { isBundledPublisherId } from "@/lib/bundled-publishers";
import { pickCanonicalShopBanner } from "@/lib/canonical-shop-banner";
import { isPendingCustomLogoId } from "@/lib/custom-logo-pending";
import {
  getShopCustomLogos,
  syncShopCustomLogosInTransaction,
} from "@/lib/custom-logo-service";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import type {
  CustomLogoSaveInput,
  PresswallConfig,
  PublisherCatalogItem,
  ShopCustomLogo,
  ShopPublisherSelection,
  StorefrontPayload,
} from "@/lib/presswall-types";
import { getSeedPublishers } from "@/lib/publishers-seed";
import { bootstrapShopBanners } from "@/lib/shop-banner-bootstrap";
import { sanitizeSvg } from "@/lib/svg-sanitize";
import { db } from "@/src/db";
import { publishers, shopConfigs } from "@/src/db/schema";

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

/**
 * Ensure every selection is resolvable against the logo library.
 * Pending client ids must already be remapped. Inline custom SVG is sanitized.
 */
function assertResolvableCustomSelections(
  selections: ShopPublisherSelection[],
  libraryById: Map<string, ShopCustomLogo>
): ShopPublisherSelection[] {
  return selections.map((selection) => {
    if (selection.publisherId) {
      return {
        publisherId: selection.publisherId,
        customUrl: selection.customUrl,
        position: selection.position,
      };
    }

    if (selection.customLogoId) {
      if (isPendingCustomLogoId(selection.customLogoId)) {
        throw new Error("Custom logo changes must be saved before selection");
      }

      if (!libraryById.has(selection.customLogoId)) {
        throw new Error("Custom outlet logo is missing from the library");
      }

      return {
        customLogoId: selection.customLogoId,
        customUrl: selection.customUrl,
        position: selection.position,
      };
    }

    const customName = selection.customName?.trim();
    const customLogoSvg = selection.customLogoSvg
      ? sanitizeSvg(selection.customLogoSvg)
      : selection.customLogoSvg;

    if (customName && !customLogoSvg?.trim()) {
      throw new Error("Custom outlet logo is invalid after sanitization");
    }

    return {
      customName,
      customLogoSvg,
      customUrl: selection.customUrl,
      position: selection.position,
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

/**
 * Pick the shop's single live banner (same rule as storefront).
 */
async function getEditorBanner(shop: string) {
  const bootstrap = await bootstrapShopBanners(shop);
  const banner = pickCanonicalShopBanner(bootstrap.banners);
  return { bootstrap, banner };
}

/**
 * Editor config comes from the shop's banners (SSOT).
 * Falls back to defaults only when bootstrap cannot produce a banner.
 */
export async function getShopConfig(shop: string): Promise<PresswallConfig> {
  const { banner } = await getEditorBanner(shop);
  return banner?.config ?? DEFAULT_PRESSWALL_CONFIG;
}

export async function needsOnboarding(shop: string): Promise<boolean> {
  const configRow = await getShopConfigRow(shop);
  return !configRow?.onboardingCompletedAt;
}

/**
 * Outlet selections for the editor — from the most recently updated banner.
 */
export async function getShopPublisherSelections(
  shop: string
): Promise<ShopPublisherSelection[]> {
  const { banner } = await getEditorBanner(shop);
  return banner?.selections ?? [];
}

export async function getEditorBannerId(shop: string): Promise<string | null> {
  const { bootstrap, banner } = await getEditorBanner(shop);
  return banner?.id ?? bootstrap.defaultBannerId;
}

export interface SaveShopPresswallResult {
  bannerId: string | null;
  customLogos: ShopCustomLogo[];
  selections: ShopPublisherSelection[];
}

/**
 * Save editor state onto the shop's single canonical banner (SSOT).
 * Does not dual-write legacy shop_configs style columns or shop_publishers.
 * shop_configs is only touched for onboarding completion metadata.
 * `bannerId` in options is ignored — only the canonical design is updated.
 */
export async function saveShopPresswall(
  shop: string,
  config: PresswallConfig,
  selections: ShopPublisherSelection[],
  options?: {
    /** @deprecated Ignored — always saves the canonical shop banner. */
    bannerId?: string | null;
    completeOnboarding?: boolean;
    customLogos?: CustomLogoSaveInput[];
  }
): Promise<SaveShopPresswallResult> {
  const now = new Date().toISOString();
  const bootstrap = await bootstrapShopBanners(shop);

  const targetBannerId =
    pickCanonicalShopBanner(bootstrap.banners)?.id ?? bootstrap.defaultBannerId;

  if (!targetBannerId) {
    throw new Error("No banner available to save");
  }

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
    const storedSelections = normalizeSelectionsForStorage(validatedSelections);

    await updateShopBannerInTransaction(
      tx,
      shop,
      targetBannerId,
      config,
      storedSelections,
      now
    );

    if (options?.completeOnboarding) {
      await tx
        .insert(shopConfigs)
        .values({
          shop,
          updatedAt: now,
          onboardingCompletedAt: now,
        })
        .onConflictDoUpdate({
          target: shopConfigs.shop,
          set: {
            onboardingCompletedAt: now,
            updatedAt: now,
          },
        });
    } else {
      // Touch updated_at so the shop row exists without overwriting styles.
      await tx
        .insert(shopConfigs)
        .values({
          shop,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: shopConfigs.shop,
          set: { updatedAt: now },
        });
    }
  });

  const { banner: savedBanner } = await getEditorBanner(shop);
  const hydratedSelections = savedBanner?.selections ?? [];

  // Re-hydrate custom names from library for the API response
  const libraryById = new Map(syncedLogos.map((logo) => [logo.id, logo]));
  const responseSelections = hydratedSelections.map((selection) => {
    if (!selection.customLogoId) {
      return selection;
    }
    const logo = libraryById.get(selection.customLogoId);
    if (!logo) {
      return selection;
    }
    return {
      ...selection,
      customName: logo.name,
      customLogoSvg: logo.logoSvg,
    };
  });

  return {
    bannerId: targetBannerId,
    customLogos: syncedLogos,
    selections: responseSelections,
  };
}

/**
 * Always returns the shop's single canonical banner design.
 * Page context is ignored (kept as an optional arg for call-site compatibility).
 */
export async function getStorefrontPayload(
  shop: string,
  context: unknown = null
): Promise<StorefrontPayload> {
  await ensurePublisherCatalogSeeded();
  const catalog = await getPublisherCatalog();
  return getResolvedStorefrontPayload(shop, catalog, context);
}
