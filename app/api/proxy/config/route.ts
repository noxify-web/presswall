import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getShopFromRequest } from "@/lib/auth-helpers";
import { parseBannerPageContext } from "@/lib/banner-page-context";
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

  const context = parseBannerPageContext(request.nextUrl.searchParams);
  const payload = await getStorefrontPayload(shop, context);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
