import type { NextRequest } from "next/server";
import { shopify } from "@/lib/shopify";

function getProxyQuery(request: NextRequest): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    query[key] = value;
  }
  return query;
}

export async function validateAppProxyRequest(
  request: NextRequest
): Promise<boolean> {
  const query = getProxyQuery(request);

  if (!query.signature) {
    return process.env.NODE_ENV === "development";
  }

  try {
    return await shopify.utils.validateHmac(query, { signator: "appProxy" });
  } catch {
    return false;
  }
}
