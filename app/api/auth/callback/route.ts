import type { NextRequest } from "next/server";
import { sessionStorage } from "@/lib/session-storage";
import { shopify } from "@/lib/shopify";

export async function GET(request: NextRequest) {
  try {
    const callback = await shopify.auth.callback({
      rawRequest: request,
      expiring: true,
    });

    const { session } = callback;
    await sessionStorage.storeSession(session);

    const host = request.nextUrl.searchParams.get("host");
    const apiKey = process.env.SHOPIFY_API_KEY ?? "";

    const appUrl = new URL(`https://${session.shop}/admin/apps/${apiKey}`);
    if (host) {
      appUrl.searchParams.set("host", host);
    }

    return Response.redirect(appUrl.toString(), 302);
  } catch (error) {
    console.error("Presswall OAuth callback failed", error);
    return new Response(
      "Could not complete Shopify authorization. Close this window and open Presswall from your Shopify admin Apps menu.",
      { status: 401 }
    );
  }
}
