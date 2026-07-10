import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionForRequest } from "@/lib/auth-helpers";
import {
  getEditorBannerId,
  getShopConfig,
  getShopPublisherSelections,
  needsOnboarding,
  saveShopPresswall,
} from "@/lib/presswall-service";
import {
  customLogoSaveSchema,
  presswallConfigSchema,
  shopPublisherSelectionSchema,
} from "@/lib/presswall-types";
import { syncStorefrontMetafield } from "@/lib/sync-storefront-metafield";

const saveSchema = z.object({
  /** @deprecated Ignored — always updates the shop's single live design. */
  bannerId: z.string().uuid().nullable().optional(),
  config: presswallConfigSchema,
  selections: z.array(shopPublisherSelectionSchema),
  customLogos: z.array(customLogoSaveSchema).optional(),
  completeOnboarding: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSessionForRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [config, selections, showOnboarding, bannerId] = await Promise.all([
    getShopConfig(session.shop),
    getShopPublisherSelections(session.shop),
    needsOnboarding(session.shop),
    getEditorBannerId(session.shop),
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
    bannerId,
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

  try {
    const result = await saveShopPresswall(
      session.shop,
      parsed.data.config,
      parsed.data.selections,
      {
        bannerId: parsed.data.bannerId,
        completeOnboarding: parsed.data.completeOnboarding,
        customLogos: parsed.data.customLogos,
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
      bannerId: result.bannerId,
      customLogos: result.customLogos,
      selections: result.selections,
      needsOnboarding: parsed.data.completeOnboarding ? false : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not save Presswall settings";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
