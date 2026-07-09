import { and, asc, eq } from "drizzle-orm";
import { listShopBanners, type ShopBanner } from "@/lib/banner-service";
import { mapShopConfigRow } from "@/lib/map-shop-config-row";
import type { ShopPublisherSelection } from "@/lib/presswall-types";
import type { BannerAssignmentTarget } from "@/lib/resolve-banner-for-context";
import { db } from "@/src/db";
import {
  shopBannerAssignments,
  shopConfigs,
  shopCustomTemplates,
  shopPublishers,
} from "@/src/db/schema";

const DEFAULT_BANNER_NAME = "Default";
const CORE_ASSIGNMENT_TARGETS = ["homepage", "all_products"] as const;
const PRODUCT_TARGET_PREFIX_PATTERN = /^product:/;

const inflightBootstrap = new Map<string, Promise<ShopBannerBootstrapResult>>();

export interface ShopBannerAssignmentRecord {
  bannerId: string;
  id: string;
  target: BannerAssignmentTarget;
  updatedAt: string;
}

export interface ProductBannerAssignmentRecord {
  bannerId: string;
  productId: string;
  productTitle?: string;
}

export interface ShopBannerAssignmentsState {
  allProductsBannerId: string | null;
  defaultBannerId: string | null;
  homepageBannerId: string | null;
  productAssignments: ProductBannerAssignmentRecord[];
}

export interface ShopBannerBootstrapResult {
  assignments: ShopBannerAssignmentRecord[];
  assignmentsState: ShopBannerAssignmentsState;
  banners: ShopBanner[];
  defaultBannerId: string | null;
}

async function readLegacySelections(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  shop: string
): Promise<ShopPublisherSelection[]> {
  const rows = await tx
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

function buildAssignmentsState(
  assignments: ShopBannerAssignmentRecord[],
  defaultBannerId: string | null
): ShopBannerAssignmentsState {
  const homepageBannerId =
    assignments.find((assignment) => assignment.target === "homepage")
      ?.bannerId ?? null;
  const allProductsBannerId =
    assignments.find((assignment) => assignment.target === "all_products")
      ?.bannerId ?? null;

  const productAssignments = assignments
    .filter(
      (assignment) =>
        !CORE_ASSIGNMENT_TARGETS.includes(
          assignment.target as (typeof CORE_ASSIGNMENT_TARGETS)[number]
        )
    )
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

type BootstrapTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function backfillEmptyTemplateSelections(
  tx: BootstrapTx,
  shop: string,
  now: string
) {
  const legacySelections = await readLegacySelections(tx, shop);
  if (legacySelections.length === 0) {
    return;
  }

  const templatesNeedingSelections = await tx
    .select({
      id: shopCustomTemplates.id,
      selectionsJson: shopCustomTemplates.selectionsJson,
    })
    .from(shopCustomTemplates)
    .where(eq(shopCustomTemplates.shop, shop));

  const selectionsJson = JSON.stringify(legacySelections);
  for (const template of templatesNeedingSelections) {
    if (template.selectionsJson === "[]") {
      await tx
        .update(shopCustomTemplates)
        .set({ selectionsJson, updatedAt: now })
        .where(eq(shopCustomTemplates.id, template.id));
    }
  }
}

/**
 * One-time migration path: copy legacy shop_configs + shop_publishers into
 * a default banner and core assignments when the shop has no banners yet.
 * After bootstrap, banners are the sole source of truth for strip content.
 */
async function ensureShopBannerBootstrap(shop: string): Promise<void> {
  await db.transaction(async (tx) => {
    const existingBanners = await tx
      .select({
        id: shopCustomTemplates.id,
        isDefault: shopCustomTemplates.isDefault,
        createdAt: shopCustomTemplates.createdAt,
      })
      .from(shopCustomTemplates)
      .where(eq(shopCustomTemplates.shop, shop))
      .orderBy(asc(shopCustomTemplates.createdAt));

    const now = new Date().toISOString();
    let defaultBannerId =
      existingBanners.find((banner) => banner.isDefault)?.id ?? null;

    if (existingBanners.length === 0) {
      const configRows = await tx
        .select()
        .from(shopConfigs)
        .where(eq(shopConfigs.shop, shop))
        .limit(1);

      const config = mapShopConfigRow(configRows[0]);
      const selections = await readLegacySelections(tx, shop);
      defaultBannerId = crypto.randomUUID();

      await tx.insert(shopCustomTemplates).values({
        id: defaultBannerId,
        shop,
        name: DEFAULT_BANNER_NAME,
        description: "Migrated from your original Presswall configuration.",
        configJson: JSON.stringify(config),
        selectionsJson: JSON.stringify(selections),
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      });
    } else if (!defaultBannerId && existingBanners[0]?.id) {
      defaultBannerId = existingBanners[0].id;

      await tx
        .update(shopCustomTemplates)
        .set({ isDefault: false, updatedAt: now })
        .where(eq(shopCustomTemplates.shop, shop));

      await tx
        .update(shopCustomTemplates)
        .set({ isDefault: true, updatedAt: now })
        .where(
          and(
            eq(shopCustomTemplates.shop, shop),
            eq(shopCustomTemplates.id, defaultBannerId)
          )
        );
    }

    await backfillEmptyTemplateSelections(tx, shop, now);

    if (!defaultBannerId) {
      return;
    }

    const existingAssignments = await tx
      .select({
        target: shopBannerAssignments.target,
      })
      .from(shopBannerAssignments)
      .where(eq(shopBannerAssignments.shop, shop));

    const assignmentTargets = new Set(
      existingAssignments.map((assignment) => assignment.target)
    );

    for (const target of CORE_ASSIGNMENT_TARGETS) {
      if (assignmentTargets.has(target)) {
        continue;
      }

      await tx.insert(shopBannerAssignments).values({
        id: crypto.randomUUID(),
        shop,
        target,
        bannerId: defaultBannerId,
        updatedAt: now,
      });
    }
  });
}

async function loadBootstrapResult(
  shop: string
): Promise<ShopBannerBootstrapResult> {
  const [banners, assignmentRows] = await Promise.all([
    listShopBanners(shop),
    db
      .select()
      .from(shopBannerAssignments)
      .where(eq(shopBannerAssignments.shop, shop))
      .orderBy(asc(shopBannerAssignments.target)),
  ]);

  const defaultBannerId =
    banners.find((banner) => banner.isDefault)?.id ?? banners[0]?.id ?? null;

  const assignments = assignmentRows.map((row) => ({
    id: row.id,
    target: row.target as BannerAssignmentTarget,
    bannerId: row.bannerId,
    updatedAt: row.updatedAt,
  }));

  return {
    banners,
    assignments,
    defaultBannerId,
    assignmentsState: buildAssignmentsState(assignments, defaultBannerId),
  };
}

async function bootstrapShopBannersInternal(
  shop: string
): Promise<ShopBannerBootstrapResult> {
  await ensureShopBannerBootstrap(shop);
  return loadBootstrapResult(shop);
}

export function bootstrapShopBanners(
  shop: string
): Promise<ShopBannerBootstrapResult> {
  const inflight = inflightBootstrap.get(shop);
  if (inflight) {
    return inflight;
  }

  const promise = bootstrapShopBannersInternal(shop).finally(() => {
    inflightBootstrap.delete(shop);
  });

  inflightBootstrap.set(shop, promise);
  return promise;
}
