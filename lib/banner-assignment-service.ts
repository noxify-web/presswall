import { and, eq } from "drizzle-orm";
import type { BannerAssignmentTarget } from "@/lib/resolve-banner-for-context";
import {
  bootstrapShopBanners,
  type ProductBannerAssignmentRecord,
  type ShopBannerAssignmentRecord,
  type ShopBannerAssignmentsState,
} from "@/lib/shop-banner-bootstrap";
import { db } from "@/src/db";
import { shopBannerAssignments } from "@/src/db/schema";

export type ShopBannerAssignment = ShopBannerAssignmentRecord;
export type ProductBannerAssignment = ProductBannerAssignmentRecord;
export type { ShopBannerAssignmentsState } from "@/lib/shop-banner-bootstrap";

const CORE_TARGETS = new Set(["homepage", "all_products"]);

export async function listShopBannerAssignments(
  shop: string
): Promise<ShopBannerAssignment[]> {
  const bootstrap = await bootstrapShopBanners(shop);
  return bootstrap.assignments;
}

export async function getShopBannerAssignmentsState(
  shop: string
): Promise<ShopBannerAssignmentsState> {
  const bootstrap = await bootstrapShopBanners(shop);
  return bootstrap.assignmentsState;
}

export async function saveShopBannerAssignments(
  shop: string,
  input: {
    allProductsBannerId?: string | null;
    homepageBannerId?: string | null;
    productAssignments?: ProductBannerAssignment[];
  }
): Promise<ShopBannerAssignmentsState> {
  const bootstrap = await bootstrapShopBanners(shop);

  const now = new Date().toISOString();
  const existing = bootstrap.assignments;
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
