import { describe, expect, test } from "bun:test";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import {
  applyDerivedSpacingPatch,
  deriveHeadingSpacing,
  deriveLogoGap,
  scaleSpacingForPreview,
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

  test("uses the same spacing multiplier for marquee layouts", () => {
    expect(deriveLogoGap(11, "marquee")).toBe(12);
    expect(deriveLogoGap(32, "marquee")).toBe(36);
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
      layout: "bar",
      logoHeight: 32,
      headingFontSize: 16,
      gap: 10,
      headingSpacing: 8,
    });

    expect(config.gap).toBe(36);
    expect(config.headingSpacing).toBe(54);
  });
});

describe("scaleSpacingForPreview", () => {
  test("scales classic bar gap with logo height for thumbnails", () => {
    // Default classic: logoHeight 28, gap 32 → thumbnail height 12
    const scaled = scaleSpacingForPreview(32, 28, 12);
    expect(scaled).toBe(14);
    expect(scaled).toBeGreaterThan(0);
  });

  test("scales marquee gap proportionally and never collapses to zero", () => {
    const scaled = scaleSpacingForPreview(36, 32, 12);
    expect(scaled).toBe(14);
    expect(scaleSpacingForPreview(8, 100, 1)).toBeGreaterThanOrEqual(2);
  });

  test("keeps full gap when preview height matches config", () => {
    expect(scaleSpacingForPreview(32, 28, 28)).toBe(32);
  });
});
