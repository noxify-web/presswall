import { describe, expect, test } from "bun:test";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import {
  applyDerivedSpacingPatch,
  deriveHeadingSpacing,
  deriveLogoGap,
  withDerivedSpacing,
} from "@/lib/presswall-spacing";

describe("deriveLogoGap", () => {
  test("derives bar spacing from logo height", () => {
    expect(deriveLogoGap(28, "bar")).toBe(32);
    expect(deriveLogoGap(22, "bar")).toBe(24);
    expect(deriveLogoGap(11, "bar")).toBe(12);
    expect(deriveLogoGap(16, "bar")).toBe(18);
    expect(deriveLogoGap(32, "bar")).toBe(36);
    expect(deriveLogoGap(28, "bar")).toBe(32);
  });

  test("uses tighter spacing for grid layouts", () => {
    expect(deriveLogoGap(11, "grid")).toBe(10);
    expect(deriveLogoGap(16, "grid")).toBe(14);
    expect(deriveLogoGap(32, "grid")).toBe(28);
  });
});

describe("deriveHeadingSpacing", () => {
  test("derives heading spacing from font size", () => {
    expect(deriveHeadingSpacing(12)).toBe(40);
    expect(deriveHeadingSpacing(11)).toBe(36);
    expect(deriveHeadingSpacing(16)).toBe(54);
    expect(deriveHeadingSpacing(14)).toBe(46);
  });
});

describe("applyDerivedSpacingPatch", () => {
  test("switches bar layouts to spread-evenly spacing", () => {
    const patch = applyDerivedSpacingPatch(
      {
        ...DEFAULT_PRESSWALL_CONFIG,
        layout: "bar",
        logoSpacing: "gap",
      },
      "layout"
    );

    expect(patch.logoSpacing).toBe("space-between");
  });
});

describe("withDerivedSpacing", () => {
  test("fills spacing fields from typography and layout", () => {
    const config = withDerivedSpacing({
      ...DEFAULT_PRESSWALL_CONFIG,
      layout: "grid",
      logoHeight: 32,
      headingFontSize: 16,
      gap: 10,
      headingSpacing: 8,
    });

    expect(config.gap).toBe(28);
    expect(config.headingSpacing).toBe(54);
  });
});
