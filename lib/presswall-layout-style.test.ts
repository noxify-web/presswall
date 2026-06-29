import { describe, expect, test } from "bun:test";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import {
  getLogosBarClassName,
  getLogosBarStyle,
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
        layout: "grid",
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
