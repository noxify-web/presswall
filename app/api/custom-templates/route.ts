import type { NextRequest } from "next/server";

/**
 * @deprecated Prefer `/api/banners`. Kept for backward compatibility.
 */
export async function GET(request: NextRequest) {
  const { GET: getBanners } = await import("@/app/api/banners/route");
  return getBanners(request);
}

/**
 * @deprecated Prefer `/api/banners`. Kept for backward compatibility.
 */
export async function POST(request: NextRequest) {
  const { POST: postBanner } = await import("@/app/api/banners/route");
  return postBanner(request);
}
