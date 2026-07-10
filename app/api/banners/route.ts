import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionForRequest } from "@/lib/auth-helpers";
import { pickCanonicalShopBanner } from "@/lib/canonical-shop-banner";
import { bootstrapShopBanners } from "@/lib/shop-banner-bootstrap";

/**
 * Read-only: returns the shop's single canonical banner (if any).
 * Creating additional merchant banners is no longer supported.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionForRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bootstrap = await bootstrapShopBanners(session.shop);
  const canonical = pickCanonicalShopBanner(bootstrap.banners);
  const banners = canonical ? [canonical] : [];

  return NextResponse.json({ banners, templates: banners });
}

export function POST() {
  return NextResponse.json(
    {
      error:
        "Multiple banners are no longer supported. Save your design from the editor instead.",
    },
    { status: 410 }
  );
}
