import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionForRequest } from "@/lib/auth-helpers";
import { getPublisherCatalog } from "@/lib/presswall-service";

export async function GET(request: NextRequest) {
  const session = await getSessionForRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const catalog = await getPublisherCatalog();
  return NextResponse.json({ publishers: catalog });
}
