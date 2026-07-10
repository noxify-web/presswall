import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionForRequest } from "@/lib/auth-helpers";
import { getShopCustomLogos } from "@/lib/custom-logo-service";
import {
  getEditorBannerId,
  getPublisherCatalog,
  getShopConfig,
  getShopPublisherSelections,
  needsOnboarding,
} from "@/lib/presswall-service";

/**
 * Single admin bootstrap payload — one auth + one round-trip for first paint.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionForRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [config, selections, showOnboarding, bannerId, catalog, logos] =
    await Promise.all([
      getShopConfig(session.shop),
      getShopPublisherSelections(session.shop),
      needsOnboarding(session.shop),
      getEditorBannerId(session.shop),
      getPublisherCatalog(),
      getShopCustomLogos(session.shop),
    ]);

  return NextResponse.json({
    bannerId,
    config,
    selections,
    needsOnboarding: showOnboarding,
    publishers: catalog,
    logos,
  });
}
