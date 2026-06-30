import { and, asc, eq } from "drizzle-orm";
import { ensureLegacyBannerMigrated } from "@/lib/legacy-banner-migration";
import type { BannerAssignmentTarget } from "@/lib/resolve-banner-for-context";
import { db } from "@/src/db";
import { shopBannerAssignments } from "@/src/db/schema";

export interface ShopBannerAssignment {
  bannerId: string;
  id: string;
  target: BannerAssignmentTarget;
  updatedAt: string;
}

export interface ProductBannerAssignment {
  bannerId: string;
  productId: string;
  productTitle?: string;
}

export interface ShopBannerAssignmentsState {
  allProductsBannerId: string | null;
  defaultBannerId: string | null;
  homepageBannerId: string | null;
  productAssignments: ProductBannerAssignment[];
}

const CORE_TARGETS = new Set(["homepage", "all_products"]);
const PRODUCT_TARGET_PREFIX_PATTERN = /^product:/;

function mapAssignmentRow(
  row: typeof shopBannerAssignments.$inferSelect
): ShopBannerAssignment {
  return {
    id: row.id,
    target: row.target as BannerAssignmentTarget,
    bannerId: row.bannerId,
    updatedAt: row.updatedAt,
  };
}

export async function listShopBannerAssignments(
  shop: string
): Promise<ShopBannerAssignment[]> {
  await ensureLegacyBannerMigrated(shop);

  const rows = await db
    .select()
    .from(shopBannerAssignments)
    .where(eq(shopBannerAssignments.shop, shop))
    .orderBy(asc(shopBannerAssignments.target));

  return rows.map(mapAssignmentRow);
}

export async function getShopBannerAssignmentsState(
  shop: string
): Promise<ShopBannerAssignmentsState> {
  const [assignments, defaultBannerId] = await Promise.all([
    listShopBannerAssignments(shop),
    ensureLegacyBannerMigrated(shop),
  ]);

  const homepageBannerId =
    assignments.find((assignment) => assignment.target === "homepage")
      ?.bannerId ?? null;
  const allProductsBannerId =
    assignments.find((assignment) => assignment.target === "all_products")
      ?.bannerId ?? null;

  const productAssignments = assignments
    .filter((assignment) => !CORE_TARGETS.has(assignment.target))
    .map((assignment) => ({
      bannerId: assignment.bannerId,
      productId: assignment.target.replace(PRODUCT_TARGET_PREFIX_PATTERN, ""),
    }));

  return {
    defaultBannerId,
    homepageBannerId,
    allProductsBannerId,
    productAssignments,
  };
}

export async function saveShopBannerAssignments(
  shop: string,
  input: {
    allProductsBannerId?: string | null;
    homepageBannerId?: string | null;
    productAssignments?: ProductBannerAssignment[];
  }
): Promise<ShopBannerAssignmentsState> {
  await ensureLegacyBannerMigrated(shop);

  const now = new Date().toISOString();
  const existing = await listShopBannerAssignments(shop);
  const existingByTarget = new Map(
    existing.map((assignment) => [assignment.target, assignment])
  );

  const nextCoreAssignments: Array<{
    bannerId: string;
    target: BannerAssignmentTarget;
  }> = [];

  if (input.homepageBannerId) {
    nextCoreAssignments.push({
      target: "homepage",
      bannerId: input.homepageBannerId,
    });
  }

  if (input.allProductsBannerId) {
    nextCoreAssignments.push({
      target: "all_products",
      bannerId: input.allProductsBannerId,
    });
  }

  const nextProductAssignments = (input.productAssignments ?? []).filter(
    (assignment) => assignment.bannerId && assignment.productId
  );

  await db.transaction(async (tx) => {
    for (const assignment of nextCoreAssignments) {
      const current = existingByTarget.get(assignment.target);
      if (current) {
        await tx
          .update(shopBannerAssignments)
          .set({ bannerId: assignment.bannerId, updatedAt: now })
          .where(eq(shopBannerAssignments.id, current.id));
      } else {
        await tx.insert(shopBannerAssignments).values({
          id: crypto.randomUUID(),
          shop,
          target: assignment.target,
          bannerId: assignment.bannerId,
          updatedAt: now,
        });
      }
    }

    const nextProductTargets = new Set(
      nextProductAssignments.map(
        (assignment) =>
          `product:${assignment.productId}` as BannerAssignmentTarget
      )
    );

    for (const assignment of existing) {
      if (CORE_TARGETS.has(assignment.target)) {
        continue;
      }

      if (!nextProductTargets.has(assignment.target)) {
        await tx
          .delete(shopBannerAssignments)
          .where(eq(shopBannerAssignments.id, assignment.id));
      }
    }

    for (const assignment of nextProductAssignments) {
      const target =
        `product:${assignment.productId}` as BannerAssignmentTarget;
      const current = existingByTarget.get(target);
      if (current) {
        await tx
          .update(shopBannerAssignments)
          .set({ bannerId: assignment.bannerId, updatedAt: now })
          .where(eq(shopBannerAssignments.id, current.id));
      } else {
        await tx.insert(shopBannerAssignments).values({
          id: crypto.randomUUID(),
          shop,
          target,
          bannerId: assignment.bannerId,
          updatedAt: now,
        });
      }
    }
  });

  return getShopBannerAssignmentsState(shop);
}

export async function removeProductBannerAssignment(
  shop: string,
  productId: string
): Promise<ShopBannerAssignmentsState> {
  const target = `product:${productId}` as BannerAssignmentTarget;

  await db
    .delete(shopBannerAssignments)
    .where(
      and(
        eq(shopBannerAssignments.shop, shop),
        eq(shopBannerAssignments.target, target)
      )
    );

  return getShopBannerAssignmentsState(shop);
}
