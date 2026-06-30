import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionForRequest } from "@/lib/auth-helpers";
import {
  listShopCustomTemplates,
  saveShopCustomTemplate,
} from "@/lib/custom-template-service";
import {
  presswallConfigSchema,
  shopPublisherSelectionSchema,
} from "@/lib/presswall-types";

const saveCustomTemplateSchema = z.object({
  config: presswallConfigSchema,
  description: z.string().trim().max(240).optional(),
  name: z.string().trim().min(1).max(80),
  selections: z.array(shopPublisherSelectionSchema),
});

export async function GET(request: NextRequest) {
  const session = await getSessionForRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await listShopCustomTemplates(session.shop);

  return NextResponse.json({ templates });
}

export async function POST(request: NextRequest) {
  const session = await getSessionForRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = saveCustomTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const template = await saveShopCustomTemplate(session.shop, parsed.data);
    return NextResponse.json({ ok: true, template });
  } catch (error) {
    if (error instanceof Error && error.message === "TEMPLATE_NAME_EXISTS") {
      return NextResponse.json(
        { error: "A template with this name already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Could not save template." },
      { status: 500 }
    );
  }
}
