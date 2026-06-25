import type { NextRequest } from "next/server";
import {
  AdminAuthenticationError,
  authenticateAdminApi,
} from "@/lib/authenticate-admin";
import { shopify } from "@/lib/shopify";

export function getShopFromRequest(request: NextRequest): string | null {
  const shop =
    request.nextUrl.searchParams.get("shop") ??
    request.headers.get("x-shopify-shop-domain");

  if (!shop) {
    return null;
  }

  return shopify.utils.sanitizeShop(shop, true) ?? null;
}

export async function getSessionForRequest(request: NextRequest) {
  try {
    const { session } = await authenticateAdminApi(
      request.nextUrl.searchParams
    );
    return session;
  } catch (error) {
    if (error instanceof AdminAuthenticationError) {
      return null;
    }

    throw error;
  }
}
