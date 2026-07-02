import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionForRequest } from "@/lib/auth-helpers";
import {
  removeProductBannerAssignment,
  saveShopBannerAssignments,
} from "@/lib/banner-assignment-service";
import { bootstrapShopBanners } from "@/lib/shop-banner-bootstrap";
import { syncStorefrontMetafield } from "@/lib/sync-storefront-metafield";

const productAssignmentSchema = z.object({
  bannerId: z.string().uuid(),
  productId: z.string().min(1),
  productTitle: z.string().optional(),
});

const saveAssignmentsSchema = z.object({
  homepageBannerId: z.string().uuid().nullable().optional(),
  allProductsBannerId: z.string().uuid().nullable().optional(),
  productAssignments: z.array(productAssignmentSchema).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSessionForRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bootstrap = await bootstrapShopBanners(session.shop);

  return NextResponse.json({
    assignments: bootstrap.assignmentsState,
    banners: bootstrap.banners.map((banner) => ({
      id: banner.id,
      name: banner.name,
      description: banner.description,
      isDefault: banner.isDefault,
    })),
  });
}

export async function PUT(request: NextRequest) {
  const session = await getSessionForRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = saveAssignmentsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const assignments = await saveShopBannerAssignments(session.shop, {
      homepageBannerId: parsed.data.homepageBannerId,
      allProductsBannerId: parsed.data.allProductsBannerId,
      productAssignments: parsed.data.productAssignments,
    });

    const accessToken = session.accessToken;
    if (accessToken) {
      const syncResult = await syncStorefrontMetafield(
        session.shop,
        accessToken
      );
      if (!syncResult.ok) {
        console.error(
          "Presswall storefront metafield sync failed",
          syncResult.error
        );
      }
    }

    return NextResponse.json({ ok: true, assignments });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save assignments";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionForRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productId = request.nextUrl.searchParams.get("product_id")?.trim();
  if (!productId) {
    return NextResponse.json({ error: "Missing product_id" }, { status: 400 });
  }

  const assignments = await removeProductBannerAssignment(
    session.shop,
    productId
  );

  const accessToken = session.accessToken;
  if (accessToken) {
    const syncResult = await syncStorefrontMetafield(session.shop, accessToken);
    if (!syncResult.ok) {
      console.error(
        "Presswall storefront metafield sync failed",
        syncResult.error
      );
    }
  }

  return NextResponse.json({ ok: true, assignments });
}
