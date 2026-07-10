import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { Session } from "@shopify/shopify-api";

const storeSession = mock(() => Promise.resolve(true));
const migrateToExpiringToken = mock(() =>
  Promise.resolve({
    session: {
      id: "offline_test.myshopify.com",
      shop: "test.myshopify.com",
      state: "",
      isOnline: false,
      accessToken: "shpat_new",
      refreshToken: "shprt_new",
      expires: new Date(Date.now() + 3_600_000),
      refreshTokenExpires: new Date(Date.now() + 7_776_000_000),
    } as Session,
  })
);
const refreshToken = mock(() =>
  Promise.resolve({
    session: {
      id: "offline_test.myshopify.com",
      shop: "test.myshopify.com",
      state: "",
      isOnline: false,
      accessToken: "shpat_refreshed",
      refreshToken: "shprt_refreshed",
      expires: new Date(Date.now() + 3_600_000),
      refreshTokenExpires: new Date(Date.now() + 7_776_000_000),
    } as Session,
  })
);

mock.module("@/lib/session-storage", () => ({
  sessionStorage: { storeSession },
}));

mock.module("@/lib/shopify", () => ({
  shopify: {
    auth: {
      migrateToExpiringToken,
      refreshToken,
    },
  },
}));

const { ensureOfflineSession, isNonExpiringOfflineSession } = await import(
  "@/lib/ensure-offline-session"
);

describe("ensureOfflineSession", () => {
  beforeEach(() => {
    migrateToExpiringToken.mockClear();
    refreshToken.mockClear();
    storeSession.mockClear();
  });

  test("isNonExpiringOfflineSession detects missing refresh and expiry", () => {
    expect(
      isNonExpiringOfflineSession({
        id: "offline_test.myshopify.com",
        shop: "test.myshopify.com",
        state: "",
        isOnline: false,
        accessToken: "shpat_legacy",
      } as Session)
    ).toBe(true);

    expect(
      isNonExpiringOfflineSession({
        id: "offline_test.myshopify.com",
        shop: "test.myshopify.com",
        state: "",
        isOnline: false,
        accessToken: "shpat_partial",
        refreshToken: "shprt",
        // missing expires → still non-expiring for our purposes
      } as Session)
    ).toBe(true);

    expect(
      isNonExpiringOfflineSession({
        id: "offline_test.myshopify.com",
        shop: "test.myshopify.com",
        state: "",
        isOnline: false,
        accessToken: "shpat_ok",
        refreshToken: "shprt_ok",
        expires: new Date(Date.now() + 60_000),
      } as Session)
    ).toBe(false);
  });

  test("migrates non-expiring offline tokens", async () => {
    const session = {
      id: "offline_test.myshopify.com",
      shop: "test.myshopify.com",
      state: "",
      isOnline: false,
      accessToken: "shpat_legacy",
    } as Session;

    const result = await ensureOfflineSession(session);

    expect(migrateToExpiringToken).toHaveBeenCalledWith({
      shop: "test.myshopify.com",
      nonExpiringOfflineAccessToken: "shpat_legacy",
    });
    expect(storeSession).toHaveBeenCalled();
    expect(result.accessToken).toBe("shpat_new");
    expect(result.refreshToken).toBe("shprt_new");
  });

  test("refreshes expired expiring offline tokens", async () => {
    const session = {
      id: "offline_test.myshopify.com",
      shop: "test.myshopify.com",
      state: "",
      isOnline: false,
      accessToken: "shpat_old",
      refreshToken: "shprt_old",
      expires: new Date(Date.now() - 1000),
    } as Session;

    const result = await ensureOfflineSession(session);

    expect(refreshToken).toHaveBeenCalledWith({
      shop: "test.myshopify.com",
      refreshToken: "shprt_old",
    });
    expect(result.accessToken).toBe("shpat_refreshed");
  });

  test("refreshes near-expiry expiring offline tokens", async () => {
    const session = {
      id: "offline_test.myshopify.com",
      shop: "test.myshopify.com",
      state: "",
      isOnline: false,
      accessToken: "shpat_old",
      refreshToken: "shprt_old",
      expires: new Date(Date.now() + 30_000),
    } as Session;

    const result = await ensureOfflineSession(session);

    expect(refreshToken).toHaveBeenCalled();
    expect(result.accessToken).toBe("shpat_refreshed");
  });

  test("returns valid expiring sessions unchanged", async () => {
    const session = {
      id: "offline_test.myshopify.com",
      shop: "test.myshopify.com",
      state: "",
      isOnline: false,
      accessToken: "shpat_valid",
      refreshToken: "shprt_valid",
      expires: new Date(Date.now() + 3_600_000),
    } as Session;

    const result = await ensureOfflineSession(session);

    expect(migrateToExpiringToken).not.toHaveBeenCalled();
    expect(refreshToken).not.toHaveBeenCalled();
    expect(result).toBe(session);
  });
});
