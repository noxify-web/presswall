import { RequestedTokenType, type Session } from "@shopify/shopify-api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  ensureOfflineSession,
  isNonExpiringOfflineSession,
} from "@/lib/ensure-offline-session";
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
    expiring: true,
  });

  await sessionStorage.storeSession(exchangedSession);

  return exchangedSession;
}

/**
 * Load/migrate/refresh offline session so Admin API never sees a non-expiring token.
 * Prefer migrate/refresh; if that fails or still non-expiring, re-mint via token exchange.
 */
async function resolveOfflineSession(
  shop: string,
  sessionToken: string
): Promise<Session> {
  const offlineId = shopify.session.getOfflineId(shop);
  let session = await sessionStorage.loadSession(offlineId);

  if (!session?.accessToken) {
    return exchangeOfflineSession(shop, sessionToken);
  }

  try {
    session = await ensureOfflineSession(session);
  } catch (error) {
    console.error(
      "Presswall ensureOfflineSession failed; re-exchanging offline token",
      { shop, error }
    );
    return exchangeOfflineSession(shop, sessionToken);
  }

  // Safety net: never hand a deprecated non-expiring token to Admin API callers.
  if (isNonExpiringOfflineSession(session)) {
    console.warn(
      "Presswall session still non-expiring after ensure; re-exchanging",
      { shop }
    );
    return exchangeOfflineSession(shop, sessionToken);
  }

  return session;
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
    const session = await resolveOfflineSession(shop, sessionToken);

    return {
      shop,
      session,
    };
  } catch (error) {
    if (error instanceof AdminAuthenticationError) {
      throw error;
    }
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
