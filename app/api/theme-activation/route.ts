import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionForRequest } from "@/lib/auth-helpers";
import { getThemeActivationStatus } from "@/lib/theme-activation";

export async function GET(request: NextRequest) {
  const session = await getSessionForRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "App configuration is incomplete" },
      { status: 500 }
    );
  }

  try {
    const status = await getThemeActivationStatus(
      session.shop,
      session.accessToken ?? "",
      apiKey
    );

    return NextResponse.json(status);
  } catch (error) {
    console.error("Presswall theme activation status failed", error);
    return NextResponse.json(
      { error: "Could not check theme activation status" },
      { status: 500 }
    );
  }
}
