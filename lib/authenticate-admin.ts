import { RequestedTokenType, type Session } from "@shopify/shopify-api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { sessionStorage } from "@/lib/session-storage";
import { shopify } from "@/lib/shopify";

export interface AuthenticatedAdmin {
  session: Session;
  shop: string;
}

export class AdminAuthenticationError extends Error {
  readonly status = 401;

  constructor(
    message = "Session expired. Reload Presswall from Shopify admin."
  ) {
    super(message);
    this.name = "AdminAuthenticationError";
  }
}

function getSessionToken(
  authorizationHeader: string | null,
  idToken: string | null
): string | null {
  if (authorizationHeader?.startsWith("Bearer ")) {
    return authorizationHeader.replace("Bearer ", "");
  }

  return idToken;
}

function buildBounceRedirectUrl(
  pathname: string,
  searchParams: URLSearchParams
) {
  const params = new URLSearchParams(searchParams);
  params.delete("id_token");

  const reloadPath = params.toString()
    ? `${pathname}?${params.toString()}`
    : pathname;

  params.set("shopify-reload", reloadPath);

  return `/session-token-bounce?${params.toString()}`;
}

async function exchangeOfflineSession(shop: string, sessionToken: string) {
  const { session: exchangedSession } = await shopify.auth.tokenExchange({
    shop,
    sessionToken,
    requestedTokenType: RequestedTokenType.OfflineAccessToken,
  });

  await sessionStorage.storeSession(exchangedSession);

  return exchangedSession;
}

async function resolveAuthenticatedAdmin(
  searchParams: URLSearchParams
): Promise<AuthenticatedAdmin> {
  const headerStore = await headers();
  const sessionToken = getSessionToken(
    headerStore.get("authorization"),
    searchParams.get("id_token")
  );

  if (!sessionToken) {
    throw new AdminAuthenticationError();
  }

  try {
    const decoded = await shopify.session.decodeSessionToken(sessionToken);
    const dest = new URL(decoded.dest);
    const shop = dest.hostname;
    const offlineId = shopify.session.getOfflineId(shop);
    let session = await sessionStorage.loadSession(offlineId);

    if (!session?.accessToken) {
      session = await exchangeOfflineSession(shop, sessionToken);
    }

    return {
      shop,
      session: session as Session,
    };
  } catch (error) {
    console.error("Presswall authenticateAdmin failed", error);
    throw new AdminAuthenticationError();
  }
}

export async function authenticateAdmin(
  searchParams: URLSearchParams,
  reloadPath = "/"
) {
  try {
    return await resolveAuthenticatedAdmin(searchParams);
  } catch (error) {
    if (error instanceof AdminAuthenticationError) {
      redirect(buildBounceRedirectUrl(reloadPath, searchParams));
    }

    throw error;
  }
}

export function authenticateAdminApi(searchParams: URLSearchParams) {
  return resolveAuthenticatedAdmin(searchParams);
}
