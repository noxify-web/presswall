import { eq } from "drizzle-orm";
import { bootstrapShopBanners } from "@/lib/shop-banner-bootstrap";
import { db } from "@/src/db";
import { shopCustomTemplates } from "@/src/db/schema";

export async function ensureLegacyBannerMigrated(
  shop: string
): Promise<string | null> {
  const bootstrap = await bootstrapShopBanners(shop);
  return bootstrap.defaultBannerId;
}

export async function syncDefaultBannerFromEditor(
  shop: string,
  configJson: string,
  selectionsJson: string
): Promise<void> {
  const bootstrap = await bootstrapShopBanners(shop);
  if (!bootstrap.defaultBannerId) {
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
    .where(eq(shopCustomTemplates.id, bootstrap.defaultBannerId));
}
