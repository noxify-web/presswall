import type { NextRequest } from "next/server";
import { exitIframeResponse, isEmbeddedAuthRequest } from "@/lib/exit-iframe";
import { shopify } from "@/lib/shopify";

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get("shop");

  if (!shop) {
    return new Response("Missing shop parameter", { status: 400 });
  }

  const sanitizedShop = shopify.utils.sanitizeShop(shop, false);
  if (!sanitizedShop) {
    return new Response("Invalid shop parameter", { status: 400 });
  }

  const authResponse = await shopify.auth.begin({
    shop: sanitizedShop,
    callbackPath: "/api/auth/callback",
    isOnline: false,
    rawRequest: request,
  });

  if (!isEmbeddedAuthRequest(request.nextUrl.searchParams)) {
    return authResponse;
  }

  const redirectUrl = authResponse.headers.get("Location");
  if (!redirectUrl) {
    return new Response("OAuth redirect URL missing", { status: 500 });
  }

  return exitIframeResponse(redirectUrl);
}
