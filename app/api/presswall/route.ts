import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionForRequest } from "@/lib/auth-helpers";
import {
  getShopConfig,
  getShopPublisherSelections,
  saveShopPresswall,
} from "@/lib/presswall-service";
import {
  presswallConfigSchema,
  shopPublisherSelectionSchema,
} from "@/lib/presswall-types";

const saveSchema = z.object({
  config: presswallConfigSchema,
  selections: z.array(shopPublisherSelectionSchema),
});

export async function GET(request: NextRequest) {
  const session = await getSessionForRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [config, selections] = await Promise.all([
    getShopConfig(session.shop),
    getShopPublisherSelections(session.shop),
  ]);

  return NextResponse.json({ config, selections });
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
    parsed.data.selections
  );

  return NextResponse.json({ ok: true });
}
