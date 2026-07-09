import { describe, expect, test } from "bun:test";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import {
  getPreviewLogoGap,
  getPreviewLogoHeight,
  getPreviewLogoMaxWidth,
} from "@/lib/presswall-preview-scale";
import { applyPresswallTemplate } from "@/lib/presswall-templates";

describe("presswall preview scale helpers", () => {
  test("live preview uses full logo height and gap", () => {
    const classic = applyPresswallTemplate("classic");
    const height = getPreviewLogoHeight(classic.logoHeight, "lg", true);
    const gap = getPreviewLogoGap(classic, height, true);

    expect(height).toBe(classic.logoHeight);
    expect(gap).toBe(classic.gap);
    expect(getPreviewLogoMaxWidth(height)).toBe(
      Math.round(classic.logoHeight * 12)
    );
  });

  test("template thumbnail scales gap with capped logo height", () => {
    const classic = applyPresswallTemplate("classic");
    const height = getPreviewLogoHeight(classic.logoHeight, "sm", false);
    const gap = getPreviewLogoGap(classic, height, false);

    expect(height).toBe(12);
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThan(classic.gap);
    // Shared strip height × width ratio — not an unbounded row override
    expect(getPreviewLogoMaxWidth(height)).toBe(144);
  });

  test("marquee config keeps proportional thumbnail gap", () => {
    const marquee = {
      ...DEFAULT_PRESSWALL_CONFIG,
      layout: "marquee" as const,
      logoHeight: 32,
      gap: 36,
      logoSpacing: "gap" as const,
    };
    const height = getPreviewLogoHeight(marquee.logoHeight, "sm", false);
    const gap = getPreviewLogoGap(marquee, height, false);

    expect(height).toBe(12);
    expect(gap).toBe(14);
    expect(getPreviewLogoMaxWidth(height)).toBe(144);
  });
});
