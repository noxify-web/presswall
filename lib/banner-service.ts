import { and, asc, desc, eq } from "drizzle-orm";
import type {
  PresswallConfig,
  ShopPublisherSelection,
} from "@/lib/presswall-types";
import {
  presswallConfigSchema,
  shopPublisherSelectionSchema,
} from "@/lib/presswall-types";
import { db } from "@/src/db";
import { shopCustomTemplates } from "@/src/db/schema";

/** Merchant-saved banner (config + outlet selections). Canonical storefront unit. */
export interface ShopBanner {
  config: PresswallConfig;
  createdAt: string;
  description: string | null;
  id: string;
  isDefault: boolean;
  name: string;
  selections: ShopPublisherSelection[];
  updatedAt: string;
}

/** @deprecated Use ShopBanner */
export type ShopCustomTemplate = ShopBanner;

function parseSelectionsJson(value: string): ShopPublisherSelection[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.flatMap((entry) => {
    const result = shopPublisherSelectionSchema.safeParse(entry);
    return result.success ? [result.data] : [];
  });
}

function mapBannerRow(
  row: typeof shopCustomTemplates.$inferSelect
): ShopBanner | null {
  let config: unknown;
  try {
    config = JSON.parse(row.configJson);
  } catch {
    return null;
  }

  const parsed = presswallConfigSchema.safeParse(config);
  if (!parsed.success) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    config: parsed.data,
    selections: parseSelectionsJson(row.selectionsJson),
    isDefault: row.isDefault,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listShopBanners(shop: string): Promise<ShopBanner[]> {
  const rows = await db
    .select()
    .from(shopCustomTemplates)
    .where(eq(shopCustomTemplates.shop, shop))
    .orderBy(asc(shopCustomTemplates.name));

  return rows
    .map((row) => mapBannerRow(row))
    .filter((banner): banner is ShopBanner => banner !== null);
}

/** @deprecated Use listShopBanners */
export const listShopCustomTemplates = listShopBanners;

export async function getShopBannerById(
  shop: string,
  id: string
): Promise<ShopBanner | null> {
  const rows = await db
    .select()
    .from(shopCustomTemplates)
    .where(
      and(eq(shopCustomTemplates.shop, shop), eq(shopCustomTemplates.id, id))
    )
    .limit(1);

  return rows[0] ? mapBannerRow(rows[0]) : null;
}

/** @deprecated Use getShopBannerById */
export const getShopCustomTemplateById = getShopBannerById;

export async function getMostRecentlyUpdatedBanner(
  shop: string
): Promise<ShopBanner | null> {
  const rows = await db
    .select()
    .from(shopCustomTemplates)
    .where(eq(shopCustomTemplates.shop, shop))
    .orderBy(desc(shopCustomTemplates.updatedAt))
    .limit(1);

  return rows[0] ? mapBannerRow(rows[0]) : null;
}

export async function createShopBanner(
  shop: string,
  input: {
    config: PresswallConfig;
    description?: string;
    name: string;
    selections: ShopPublisherSelection[];
  }
): Promise<ShopBanner> {
  const now = new Date().toISOString();
  const trimmedName = input.name.trim();
  const trimmedDescription = input.description?.trim() || null;

  const existing = await db
    .select({ id: shopCustomTemplates.id })
    .from(shopCustomTemplates)
    .where(
      and(
        eq(shopCustomTemplates.shop, shop),
        eq(shopCustomTemplates.name, trimmedName)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("BANNER_NAME_EXISTS");
  }

  const id = crypto.randomUUID();
  await db.insert(shopCustomTemplates).values({
    id,
    shop,
    name: trimmedName,
    description: trimmedDescription,
    configJson: JSON.stringify(input.config),
    selectionsJson: JSON.stringify(
      normalizeSelectionsForStorage(input.selections)
    ),
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  });

  const saved = await getShopBannerById(shop, id);
  if (!saved) {
    throw new Error("BANNER_SAVE_FAILED");
  }

  return saved;
}

/** @deprecated Use createShopBanner */
export function saveShopCustomTemplate(
  shop: string,
  input: {
    config: PresswallConfig;
    description?: string;
    name: string;
    selections: ShopPublisherSelection[];
  }
): Promise<ShopBanner> {
  return createShopBanner(shop, input);
}

export type BannerWriteTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Persist config + selections on an existing banner (atomic with caller tx). */
export async function updateShopBannerInTransaction(
  tx: BannerWriteTx,
  shop: string,
  bannerId: string,
  config: PresswallConfig,
  selections: ShopPublisherSelection[],
  now = new Date().toISOString()
): Promise<void> {
  await tx
    .update(shopCustomTemplates)
    .set({
      configJson: JSON.stringify(config),
      selectionsJson: JSON.stringify(normalizeSelectionsForStorage(selections)),
      updatedAt: now,
    })
    .where(
      and(
        eq(shopCustomTemplates.shop, shop),
        eq(shopCustomTemplates.id, bannerId)
      )
    );
}

export async function updateShopBanner(
  shop: string,
  bannerId: string,
  config: PresswallConfig,
  selections: ShopPublisherSelection[]
): Promise<ShopBanner | null> {
  const now = new Date().toISOString();
  await db.transaction(async (tx) => {
    await updateShopBannerInTransaction(
      tx,
      shop,
      bannerId,
      config,
      selections,
      now
    );
  });

  return getShopBannerById(shop, bannerId);
}

/**
 * Store only id references + position (+ optional custom URL).
 * Name/SVG live in the custom logo library and resolve at read time.
 */
export function normalizeSelectionsForStorage(
  selections: ShopPublisherSelection[]
): ShopPublisherSelection[] {
  return selections.map((selection, index) => {
    if (selection.publisherId) {
      return {
        publisherId: selection.publisherId,
        customUrl: selection.customUrl,
        position: selection.position ?? index,
      };
    }

    if (selection.customLogoId) {
      return {
        customLogoId: selection.customLogoId,
        customUrl: selection.customUrl,
        position: selection.position ?? index,
      };
    }

    // Legacy inline custom outlet — keep until migrated into library
    return {
      customName: selection.customName,
      customLogoSvg: selection.customLogoSvg,
      customUrl: selection.customUrl,
      position: selection.position ?? index,
    };
  });
}

/** Remove a custom logo id from every banner's selections for a shop. */
export async function scrubCustomLogoFromShopBanners(
  shop: string,
  logoId: string
): Promise<void> {
  const rows = await db
    .select()
    .from(shopCustomTemplates)
    .where(eq(shopCustomTemplates.shop, shop));

  const now = new Date().toISOString();

  for (const row of rows) {
    const selections = parseSelectionsJson(row.selectionsJson);
    const next = selections.filter(
      (selection) => selection.customLogoId !== logoId
    );

    if (next.length === selections.length) {
      continue;
    }

    await db
      .update(shopCustomTemplates)
      .set({
        selectionsJson: JSON.stringify(normalizeSelectionsForStorage(next)),
        updatedAt: now,
      })
      .where(eq(shopCustomTemplates.id, row.id));
  }
}
