import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { applyEmbeddedAppHeaders } from "@/lib/embedded-headers";

export function middleware(_request: NextRequest) {
  return applyEmbeddedAppHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
