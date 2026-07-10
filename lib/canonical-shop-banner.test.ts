import { describe, expect, test } from "bun:test";
import {
  pickCanonicalShopBanner,
  pickCanonicalShopBannerId,
} from "@/lib/canonical-shop-banner";

function banner(
  id: string,
  options: { isDefault?: boolean; updatedAt?: string } = {}
) {
  return {
    id,
    isDefault: options.isDefault ?? false,
    updatedAt: options.updatedAt ?? "2026-01-01T00:00:00.000Z",
  };
}

describe("pickCanonicalShopBanner", () => {
  test("returns null for an empty list", () => {
    expect(pickCanonicalShopBanner([])).toBeNull();
    expect(pickCanonicalShopBannerId([])).toBeNull();
  });

  test("prefers the default banner over more recently updated ones", () => {
    const banners = [
      banner("older-custom", { updatedAt: "2026-06-01T00:00:00.000Z" }),
      banner("default", {
        isDefault: true,
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
      banner("newest", { updatedAt: "2026-07-01T00:00:00.000Z" }),
    ];

    expect(pickCanonicalShopBanner(banners)?.id).toBe("default");
    expect(pickCanonicalShopBannerId(banners)).toBe("default");
  });

  test("falls back to most recently updated when no default is set", () => {
    const banners = [
      banner("mid", { updatedAt: "2026-03-01T00:00:00.000Z" }),
      banner("newest", { updatedAt: "2026-05-01T00:00:00.000Z" }),
      banner("oldest", { updatedAt: "2026-01-01T00:00:00.000Z" }),
    ];

    expect(pickCanonicalShopBanner(banners)?.id).toBe("newest");
  });

  test("returns the sole banner regardless of flags", () => {
    expect(
      pickCanonicalShopBanner([
        banner("only", {
          isDefault: false,
          updatedAt: "2026-02-01T00:00:00.000Z",
        }),
      ])?.id
    ).toBe("only");
  });
});
