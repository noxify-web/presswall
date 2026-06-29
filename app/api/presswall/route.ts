import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionForRequest } from "@/lib/auth-helpers";
import {
  getShopConfig,
  getShopPublisherSelections,
  needsOnboarding,
  saveShopPresswall,
} from "@/lib/presswall-service";
import {
  presswallConfigSchema,
  shopPublisherSelectionSchema,
} from "@/lib/presswall-types";
import { syncStorefrontMetafield } from "@/lib/sync-storefront-metafield";

const saveSchema = z.object({
  config: presswallConfigSchema,
  selections: z.array(shopPublisherSelectionSchema),
  completeOnboarding: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSessionForRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [config, selections, showOnboarding] = await Promise.all([
    getShopConfig(session.shop),
    getShopPublisherSelections(session.shop),
    needsOnboarding(session.shop),
  ]);

  const accessToken = session.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  syncStorefrontMetafield(session.shop, accessToken).then((result) => {
    if (!result.ok) {
      console.error("Presswall storefront metafield sync failed", result.error);
    }
  });

  return NextResponse.json({
    config,
    selections,
    needsOnboarding: showOnboarding,
  });
}

export async function PUT(request: NextRequest) {
  const session = await getSessionForRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = saveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await saveShopPresswall(
    session.shop,
    parsed.data.config,
    parsed.data.selections,
    {
      completeOnboarding: parsed.data.completeOnboarding,
    }
  );

  const accessToken = session.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const syncResult = await syncStorefrontMetafield(session.shop, accessToken);

  if (!syncResult.ok) {
    console.error(
      "Presswall storefront metafield sync failed",
      syncResult.error
    );
  }

  return NextResponse.json({
    ok: true,
    needsOnboarding: parsed.data.completeOnboarding ? false : undefined,
  });
}
