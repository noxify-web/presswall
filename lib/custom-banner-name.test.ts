import { describe, expect, test } from "bun:test";
import { nextCustomBannerName } from "@/lib/custom-banner-name";

describe("nextCustomBannerName", () => {
  test("starts at Custom banner 1 when no names exist", () => {
    expect(nextCustomBannerName([])).toBe("Custom banner 1");
  });

  test("increments past existing Custom banner N names", () => {
    expect(nextCustomBannerName(["Custom banner 1", "Holiday strip"])).toBe(
      "Custom banner 2"
    );
    expect(
      nextCustomBannerName([
        "Custom banner 1",
        "Custom banner 2",
        "Custom banner 4",
      ])
    ).toBe("Custom banner 3");
  });

  test("ignores non-matching names and zero/negative indices", () => {
    expect(nextCustomBannerName(["My banner", "custom banner 1"])).toBe(
      "Custom banner 1"
    );
  });
});
