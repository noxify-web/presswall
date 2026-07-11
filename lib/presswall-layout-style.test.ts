import { describe, expect, test } from "bun:test";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import {
  getBarColumnCount,
  getLogosBarClassName,
  getLogosBarConstrainedStyle,
  getLogosBarStyle,
  shouldConstrainBarRows,
  usesDistributedLogoSpacing,
} from "@/lib/presswall-layout-style";

describe("usesDistributedLogoSpacing", () => {
  test("applies to bar layouts with space-between spacing", () => {
    expect(
      usesDistributedLogoSpacing({
        layout: "bar",
        logoSpacing: "space-between",
      })
    ).toBe(true);
  });

  test("does not apply to fixed-gap bar layouts or other layouts", () => {
    expect(
      usesDistributedLogoSpacing({
        layout: "bar",
        logoSpacing: "gap",
      })
    ).toBe(false);
    expect(
      usesDistributedLogoSpacing({
        layout: "marquee",
        logoSpacing: "space-between",
      })
    ).toBe(false);
  });
});

describe("bar layout styles", () => {
  test("uses justify-between without gap for distributed spacing", () => {
    expect(getLogosBarClassName("center", "space-between")).toContain(
      "justify-between"
    );
    expect(getLogosBarStyle(36, "space-between")).toBeUndefined();
  });

  test("uses alignment and gap for fixed-gap spacing", () => {
    expect(getLogosBarClassName("center", "gap")).toContain("justify-center");
    expect(getLogosBarStyle(DEFAULT_PRESSWALL_CONFIG.gap, "gap")).toEqual({
      gap: `${DEFAULT_PRESSWALL_CONFIG.gap}px`,
    });
  });
});

describe("bar grid columns", () => {
  test("always constrains bar rows so long logos cannot overflow cells", () => {
    expect(shouldConstrainBarRows("mobile")).toBe(true);
    expect(shouldConstrainBarRows("desktop")).toBe(true);
  });

  test("uses min(itemCount, logosPerRow) so few logos still span full width", () => {
    expect(getBarColumnCount(4, 4)).toBe(4);
    expect(getBarColumnCount(2, 4)).toBe(2);
    expect(getBarColumnCount(6, 4)).toBe(4);
    expect(getBarColumnCount(1, 2)).toBe(1);
    expect(getBarColumnCount(0, 4)).toBe(4);
  });

  test("uses row gap and a half-gap column breathing room for space-between bars", () => {
    expect(getLogosBarConstrainedStyle(2, 24, "space-between")).toEqual({
      gap: "24px",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      width: "100%",
      columnGap: "12px",
      rowGap: "24px",
    });
    expect(getLogosBarConstrainedStyle(2, 32, "space-between").columnGap).toBe(
      "16px"
    );
  });
});
