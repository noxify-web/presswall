import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getShopFromRequest } from "@/lib/auth-helpers";
import { getStorefrontPayload } from "@/lib/presswall-service";
import { validateAppProxyRequest } from "@/lib/validate-app-proxy";

export async function GET(request: NextRequest) {
  const isValidProxy = await validateAppProxyRequest(request);
  if (!isValidProxy) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shop = getShopFromRequest(request);

  if (!shop) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }

  // Single shop-wide design — page_type / product_id query params are ignored.
  const payload = await getStorefrontPayload(shop);

  // Same-origin via Shopify app proxy — no public CORS needed.
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
