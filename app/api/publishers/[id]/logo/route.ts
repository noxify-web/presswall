import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { parseLogoVariant } from "@/lib/logo-variant";
import { readBundledPublisherLogo } from "@/lib/read-bundled-logo";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const variant = parseLogoVariant(
    request.nextUrl.searchParams.get("variant"),
    "black"
  );
  const logo = await readBundledPublisherLogo(id, variant);

  if (!logo) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(logo.body), {
    headers: {
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Type": logo.contentType,
      "X-Presswall-Logo-Variant": logo.variant,
    },
  });
}
