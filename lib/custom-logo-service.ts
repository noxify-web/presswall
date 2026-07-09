import { and, asc, eq, inArray } from "drizzle-orm";
import { scrubCustomLogoFromShopBanners } from "@/lib/banner-service";
import { isPendingCustomLogoId } from "@/lib/custom-logo-pending";
import type { ShopCustomLogo } from "@/lib/presswall-types";
import { sanitizeSvg } from "@/lib/svg-sanitize";
import { db } from "@/src/db";
import { shopCustomLogos, shopPublishers } from "@/src/db/schema";

function mapCustomLogoRow(
  row: typeof shopCustomLogos.$inferSelect
): ShopCustomLogo {
  return {
    id: row.id,
    name: row.name,
    logoSvg: row.logoSvg,
    createdAt: row.createdAt,
  };
}

export async function getShopCustomLogos(
  shop: string
): Promise<ShopCustomLogo[]> {
  const rows = await db
    .select()
    .from(shopCustomLogos)
    .where(eq(shopCustomLogos.shop, shop))
    .orderBy(asc(shopCustomLogos.createdAt));

  return rows.map(mapCustomLogoRow);
}

export async function createShopCustomLogo(
  shop: string,
  name: string,
  logoSvg: string
): Promise<ShopCustomLogo> {
  const sanitized = sanitizeSvg(logoSvg);
  if (!sanitized) {
    throw new Error("Custom outlet logo is invalid after sanitization");
  }

  const logo: ShopCustomLogo = {
    id: crypto.randomUUID(),
    name: name.trim(),
    logoSvg: sanitized,
    createdAt: new Date().toISOString(),
  };

  await db.insert(shopCustomLogos).values({
    id: logo.id,
    shop,
    name: logo.name,
    logoSvg: logo.logoSvg,
    createdAt: logo.createdAt,
  });

  return logo;
}

export async function deleteShopCustomLogo(
  shop: string,
  logoId: string
): Promise<boolean> {
  const deleted = await db.transaction(async (tx) => {
    const removed = await tx
      .delete(shopCustomLogos)
      .where(
        and(eq(shopCustomLogos.id, logoId), eq(shopCustomLogos.shop, shop))
      )
      .returning({ id: shopCustomLogos.id });

    if (removed.length === 0) {
      return false;
    }

    // Legacy table — still clean up if present after historical dual-write.
    await tx
      .delete(shopPublishers)
      .where(
        and(
          eq(shopPublishers.shop, shop),
          eq(shopPublishers.customLogoId, logoId)
        )
      );

    return true;
  });

  if (deleted) {
    // Banners are SSOT for selections — scrub the logo from every banner.
    await scrubCustomLogoFromShopBanners(shop, logoId);
  }

  return deleted;
}

export interface CustomLogoSyncInput {
  id: string;
  logoSvg: string;
  name: string;
}

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function syncShopCustomLogosInTransaction(
  tx: DbTransaction,
  shop: string,
  desired: CustomLogoSyncInput[]
): Promise<{ idMap: Map<string, string>; logos: ShopCustomLogo[] }> {
  const idMap = new Map<string, string>();
  const existing = await tx
    .select()
    .from(shopCustomLogos)
    .where(eq(shopCustomLogos.shop, shop));

  const desiredPersistedIds = new Set(
    desired
      .filter((logo) => !isPendingCustomLogoId(logo.id))
      .map((logo) => logo.id)
  );

  const deleteIds = existing
    .map((row) => row.id)
    .filter((id) => !desiredPersistedIds.has(id));

  if (deleteIds.length > 0) {
    await tx
      .delete(shopCustomLogos)
      .where(
        and(
          eq(shopCustomLogos.shop, shop),
          inArray(shopCustomLogos.id, deleteIds)
        )
      );

    await tx
      .delete(shopPublishers)
      .where(
        and(
          eq(shopPublishers.shop, shop),
          inArray(shopPublishers.customLogoId, deleteIds)
        )
      );
  }

  for (const logo of desired) {
    if (!isPendingCustomLogoId(logo.id)) {
      continue;
    }

    const sanitized = sanitizeSvg(logo.logoSvg);
    if (!sanitized) {
      throw new Error("Custom outlet logo is invalid after sanitization");
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await tx.insert(shopCustomLogos).values({
      id,
      shop,
      name: logo.name.trim(),
      logoSvg: sanitized,
      createdAt,
    });

    idMap.set(logo.id, id);
  }

  const rows = await tx
    .select()
    .from(shopCustomLogos)
    .where(eq(shopCustomLogos.shop, shop))
    .orderBy(asc(shopCustomLogos.createdAt));

  return {
    idMap,
    logos: rows.map(mapCustomLogoRow),
  };
}

export function syncShopCustomLogos(
  shop: string,
  desired: CustomLogoSyncInput[]
): Promise<{ idMap: Map<string, string>; logos: ShopCustomLogo[] }> {
  return db.transaction((tx) =>
    syncShopCustomLogosInTransaction(tx, shop, desired)
  );
}
