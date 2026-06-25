import type { NextRequest } from "next/server";
import { shopify } from "@/lib/shopify";

export async function GET(request: NextRequest) {
  const callback = await shopify.auth.callback({
    rawRequest: request,
  });

  const { session } = callback;
  const host = request.nextUrl.searchParams.get("host");
  const apiKey = process.env.SHOPIFY_API_KEY ?? "";

  const appUrl = new URL(`https://${session.shop}/admin/apps/${apiKey}`);
  if (host) {
    appUrl.searchParams.set("host", host);
  }

  return Response.redirect(appUrl.toString(), 302);
}
