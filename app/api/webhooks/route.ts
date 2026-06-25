import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { sessionStorage } from "@/lib/session-storage";
import { shopify } from "@/lib/shopify";
import { db } from "@/src/db";
import { shopConfigs, shopPublishers } from "@/src/db/schema";

async function cleanupShop(shop: string) {
  const shopSessions = await sessionStorage.findSessionsByShop(shop);
  await sessionStorage.deleteSessions(
    shopSessions.map((session) => session.id)
  );
  await db.delete(shopPublishers).where(eq(shopPublishers.shop, shop));
  await db.delete(shopConfigs).where(eq(shopConfigs.shop, shop));
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const validation = await shopify.webhooks.validate({
    rawBody,
    rawRequest: request,
  });

  if (!validation.valid) {
    return new Response("Invalid webhook", { status: 401 });
  }

  const topic = validation.topic;
  const shop = validation.domain;

  if (topic === "APP_UNINSTALLED" && shop) {
    await cleanupShop(shop);
  }

  return new Response(null, { status: 200 });
}
