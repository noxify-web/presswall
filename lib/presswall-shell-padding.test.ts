import { describe, expect, test } from "bun:test";
import {
  DEFAULT_PRESSWALL_CONTENT_MAX_WIDTH,
  DESKTOP_SHELL_PADDING_X_BOOST,
  formatContentMaxWidth,
  getEffectiveShellPaddingX,
} from "@/lib/presswall-shell-padding";

describe("formatContentMaxWidth", () => {
  test("formats pixel widths for CSS max-width", () => {
    expect(formatContentMaxWidth(900)).toBe("900px");
    expect(DEFAULT_PRESSWALL_CONTENT_MAX_WIDTH).toBe(900);
    expect(formatContentMaxWidth()).toBe(
      `${DEFAULT_PRESSWALL_CONTENT_MAX_WIDTH}px`
    );
  });
});

describe("getEffectiveShellPaddingX", () => {
  test("adds desktop boost only on desktop viewport", () => {
    expect(getEffectiveShellPaddingX(24, "desktop")).toBe(
      24 + DESKTOP_SHELL_PADDING_X_BOOST
    );
    expect(getEffectiveShellPaddingX(24, "mobile")).toBe(24);
  });
});
