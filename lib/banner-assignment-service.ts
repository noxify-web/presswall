import { and, eq } from "drizzle-orm";
import {
  bootstrapShopBanners,
  type ProductBannerAssignmentRecord,
  type ShopBannerAssignmentRecord,
  type ShopBannerAssignmentsState,
} from "@/lib/shop-banner-bootstrap";
import { db } from "@/src/db";
import { shopBannerAssignments } from "@/src/db/schema";

/** @deprecated Legacy assignment targets — not used for storefront resolution. */
type BannerAssignmentTarget = "homepage" | "all_products" | `product:${string}`;

export type ShopBannerAssignment = ShopBannerAssignmentRecord;
export type ProductBannerAssignment = ProductBannerAssignmentRecord;
export type { ShopBannerAssignmentsState } from "@/lib/shop-banner-bootstrap";

const CORE_TARGETS = new Set(["homepage", "all_products"]);

type AssignmentTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function deleteCoreAssignmentIfCleared(
  tx: AssignmentTx,
  existingByTarget: Map<BannerAssignmentTarget, ShopBannerAssignmentRecord>,
  target: BannerAssignmentTarget,
  bannerId: string | null | undefined
) {
  if (bannerId !== null) {
    return;
  }

  const current = existingByTarget.get(target);
  if (current) {
    await tx
      .delete(shopBannerAssignments)
      .where(eq(shopBannerAssignments.id, current.id));
  }
}

async function upsertAssignment(
  tx: AssignmentTx,
  shop: string,
  now: string,
  existingByTarget: Map<BannerAssignmentTarget, ShopBannerAssignmentRecord>,
  target: BannerAssignmentTarget,
  bannerId: string
) {
  const current = existingByTarget.get(target);
  if (current) {
    await tx
      .update(shopBannerAssignments)
      .set({ bannerId, updatedAt: now })
      .where(eq(shopBannerAssignments.id, current.id));
    return;
  }

  await tx.insert(shopBannerAssignments).values({
    id: crypto.randomUUID(),
    shop,
    target,
    bannerId,
    updatedAt: now,
  });
}

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

  const bannerIds = new Set(bootstrap.banners.map((banner) => banner.id));

  const assertBannerId = (bannerId: string, label: string) => {
    if (!bannerIds.has(bannerId)) {
      throw new Error(`${label} references an unknown banner`);
    }
  };

  const nextCoreAssignments: Array<{
    bannerId: string;
    target: BannerAssignmentTarget;
  }> = [];

  if (input.homepageBannerId) {
    assertBannerId(input.homepageBannerId, "Homepage assignment");
    nextCoreAssignments.push({
      target: "homepage",
      bannerId: input.homepageBannerId,
    });
  }

  if (input.allProductsBannerId) {
    assertBannerId(input.allProductsBannerId, "All products assignment");
    nextCoreAssignments.push({
      target: "all_products",
      bannerId: input.allProductsBannerId,
    });
  }

  const nextProductAssignments = (input.productAssignments ?? []).filter(
    (assignment) => assignment.bannerId && assignment.productId
  );

  for (const assignment of nextProductAssignments) {
    assertBannerId(assignment.bannerId, "Product assignment");
  }

  await db.transaction(async (tx) => {
    await deleteCoreAssignmentIfCleared(
      tx,
      existingByTarget,
      "homepage",
      input.homepageBannerId
    );
    await deleteCoreAssignmentIfCleared(
      tx,
      existingByTarget,
      "all_products",
      input.allProductsBannerId
    );

    for (const assignment of nextCoreAssignments) {
      await upsertAssignment(
        tx,
        shop,
        now,
        existingByTarget,
        assignment.target,
        assignment.bannerId
      );
    }

    const nextProductTargets = new Set(
      nextProductAssignments.map(
        (assignment) =>
          `product:${assignment.productId}` as BannerAssignmentTarget
      )
    );

    for (const assignment of existing) {
      if (
        CORE_TARGETS.has(assignment.target) ||
        nextProductTargets.has(assignment.target)
      ) {
        continue;
      }

      await tx
        .delete(shopBannerAssignments)
        .where(eq(shopBannerAssignments.id, assignment.id));
    }

    for (const assignment of nextProductAssignments) {
      const target =
        `product:${assignment.productId}` as BannerAssignmentTarget;
      await upsertAssignment(
        tx,
        shop,
        now,
        existingByTarget,
        target,
        assignment.bannerId
      );
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
