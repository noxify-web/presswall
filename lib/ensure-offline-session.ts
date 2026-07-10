import type { Session } from "@shopify/shopify-api";
import { sessionStorage } from "@/lib/session-storage";
import { shopify } from "@/lib/shopify";

/** Refresh when fewer than this many ms remain on the access token. */
const ACCESS_TOKEN_REFRESH_SKEW_MS = 2 * 60 * 1000;

/**
 * Non-expiring offline tokens have no refresh token and no access-token expiry.
 * Shopify Partner monitoring flags Admin API calls made with these.
 */
export function isNonExpiringOfflineSession(session: Session): boolean {
  if (session.isOnline || !session.accessToken) {
    return false;
  }

  const hasRefresh = Boolean(session.refreshToken?.trim());
  const hasExpiry =
    session.expires instanceof Date && !Number.isNaN(session.expires.getTime());

  // Either signal missing means we cannot treat this as a modern expiring offline session.
  return !(hasRefresh && hasExpiry);
}

function isAccessTokenExpiredOrNearExpiry(session: Session): boolean {
  if (
    !(session.expires instanceof Date) ||
    Number.isNaN(session.expires.getTime())
  ) {
    return false;
  }

  return session.expires.getTime() <= Date.now() + ACCESS_TOKEN_REFRESH_SKEW_MS;
}

/**
 * Ensures the offline session is safe for Admin API use:
 * - migrates legacy non-expiring tokens → expiring + refresh
 * - refreshes expiring tokens that are expired or near expiry
 */
export async function ensureOfflineSession(session: Session): Promise<Session> {
  if (session.isOnline || !session.accessToken) {
    return session;
  }

  if (isNonExpiringOfflineSession(session)) {
    console.info("Presswall migrating non-expiring offline token", {
      shop: session.shop,
    });
    const { session: migrated } = await shopify.auth.migrateToExpiringToken({
      shop: session.shop,
      nonExpiringOfflineAccessToken: session.accessToken,
    });
    await sessionStorage.storeSession(migrated);
    return migrated;
  }

  if (isAccessTokenExpiredOrNearExpiry(session) && session.refreshToken) {
    console.info("Presswall refreshing expiring offline token", {
      shop: session.shop,
    });
    const { session: refreshed } = await shopify.auth.refreshToken({
      shop: session.shop,
      refreshToken: session.refreshToken,
    });
    await sessionStorage.storeSession(refreshed);
    return refreshed;
  }

  return session;
}
