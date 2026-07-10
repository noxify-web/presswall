import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * @deprecated Prefer `/api/banners` (read-only). Creating templates/banners
 * via this endpoint is no longer supported.
 */
export async function GET(request: NextRequest) {
  const { GET: getBanners } = await import("@/app/api/banners/route");
  return getBanners(request);
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
