import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getLogoSlotStyle,
  getStorefrontLogoMaxWidth,
  STOREFRONT_LOGO_MAX_WIDTH_RATIO,
} from "@/lib/presswall-logo-style";

const ROW_SLOT_UNBOUNDED_MAX_WIDTH =
  /\.presswall-logo-row\s+\.presswall-logo-slot\s*\{[^}]*max-width:\s*none/;
const ROW_IMG_UNBOUNDED_MAX_WIDTH =
  /\.presswall-logo-row\s+\.presswall-logo-slot\s*>\s*img[^}]*max-width:\s*none/;

describe("getStorefrontLogoMaxWidth", () => {
  test("allows wide wordmarks to keep full strip height", () => {
    // Economist (~8.6:1) and FT (~12:1) need more than a 3× cap.
    expect(STOREFRONT_LOGO_MAX_WIDTH_RATIO).toBe(12);
    expect(getStorefrontLogoMaxWidth(28)).toBe(336);
    expect(getStorefrontLogoMaxWidth(12)).toBe(144);
    expect(getStorefrontLogoMaxWidth(0)).toBe(0);
  });

  test("sets CSS custom properties used by admin logo slots", () => {
    expect(getLogoSlotStyle(28, 336)).toMatchObject({
      "--logo-height": "28px",
      "--logo-max-width": "336px",
    });
  });
});

describe("admin logo CSS parity with storefront", () => {
  test("does not unbounded max-width inside logo rows", () => {
    const adminCss = readFileSync(
      join(process.cwd(), "app/globals.css"),
      "utf8"
    );
    const themeCss = readFileSync(
      join(process.cwd(), "extensions/presswall-theme/assets/presswall.css"),
      "utf8"
    );

    // Former override that caused overlapping logos in admin previews.
    expect(adminCss).not.toMatch(ROW_SLOT_UNBOUNDED_MAX_WIDTH);
    expect(adminCss).not.toMatch(ROW_IMG_UNBOUNDED_MAX_WIDTH);

    expect(adminCss).toContain("max-width: var(--logo-max-width");
    expect(adminCss).toContain("height: 100%");
    // Mobile grid cells clamp logos so wide wordmarks cannot overflow.
    expect(adminCss).toContain(".presswall-logo-row.grid .presswall-logo-slot");
    expect(adminCss).toContain("max-width: 100%");
    expect(themeCss).toContain(
      "--presswall-logo-max-width: calc(var(--presswall-logo-height) * 12)"
    );
    expect(themeCss).toContain("max-width: var(--presswall-logo-max-width)");
    expect(themeCss).toContain("height: 100%");
    expect(themeCss).toContain("@media (max-width: 639px)");
    expect(themeCss).toContain("max-width: 100%");
  });
});
