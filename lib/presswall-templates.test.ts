import { describe, expect, test } from "bun:test";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import {
  applyPresswallTemplate,
  findMatchingPresswallTemplateId,
  getPresswallDesignLabel,
  getResolvedPresswallTemplateConfig,
  resolveOnboardingDesignConfig,
  resolveTemplateLogoSpacing,
} from "@/lib/presswall-templates";
import type { PresswallConfig } from "@/lib/presswall-types";

describe("resolveTemplateLogoSpacing", () => {
  test("defaults bar layouts to spread evenly", () => {
    expect(resolveTemplateLogoSpacing("bar")).toBe("space-between");
    expect(resolveTemplateLogoSpacing("bar", "gap")).toBe("gap");
  });

  test("keeps fixed gap for marquee layouts", () => {
    expect(resolveTemplateLogoSpacing("marquee")).toBe("gap");
    expect(resolveTemplateLogoSpacing("marquee", "space-between")).toBe("gap");
  });
});

describe("applyPresswallTemplate", () => {
  test("resets omitted keys instead of carrying them from a prior config", () => {
    const softCard = getResolvedPresswallTemplateConfig("soft-card");

    expect(softCard.grayscaleOpacity).toBe(
      DEFAULT_PRESSWALL_CONFIG.grayscaleOpacity
    );
    expect(softCard.logoHeight).toBe(28);
    expect(softCard.colorMode).toBe("black");

    const classic = applyPresswallTemplate("classic");

    expect(classic.grayscaleOpacity).toBe(
      DEFAULT_PRESSWALL_CONFIG.grayscaleOpacity
    );
    expect(findMatchingPresswallTemplateId(classic)).toBe("classic");
  });

  test("preserves explicit marquee spacing overrides", () => {
    const marquee = getResolvedPresswallTemplateConfig("marquee");

    expect(marquee.logoHeight).toBe(28);
    expect(marquee.gap).toBe(50);
    expect(marquee.logoSpacing).toBe("gap");
    expect(findMatchingPresswallTemplateId(marquee)).toBe("marquee");
  });

  test("bar templates spread logos evenly by default", () => {
    const classic = getResolvedPresswallTemplateConfig("classic");
    const dark = getResolvedPresswallTemplateConfig("dark");
    const softCard = getResolvedPresswallTemplateConfig("soft-card");

    // Classic / Dark band / Soft card: equal-height strip + justify-between
    expect(classic.logoSpacing).toBe("space-between");
    expect(dark.logoSpacing).toBe("space-between");
    expect(softCard.logoSpacing).toBe("space-between");
    expect(classic.logoHeight).toBe(28);
    expect(findMatchingPresswallTemplateId(classic)).toBe("classic");
    expect(dark.logoHeight).toBe(classic.logoHeight);
    expect(softCard.logoHeight).toBe(classic.logoHeight);
    expect(softCard.headingText).toBe(classic.headingText);
    expect(softCard.paddingY).toBe(classic.paddingY);
  });

  test("matches after switching templates from a customized current state", () => {
    const customized: PresswallConfig = {
      ...getResolvedPresswallTemplateConfig("soft-card"),
      gap: 42,
      headingText: "Press",
      colorMode: "color",
    };

    expect(findMatchingPresswallTemplateId(customized)).toBeNull();

    const dark = applyPresswallTemplate("dark");

    expect(findMatchingPresswallTemplateId(dark)).toBe("dark");
    expect(getPresswallDesignLabel(dark)).toBe("Dark band");
  });
});

describe("findMatchingPresswallTemplateId", () => {
  test("matches a pristine classic template config", () => {
    const config = getResolvedPresswallTemplateConfig("classic");

    expect(findMatchingPresswallTemplateId(config)).toBe("classic");
  });

  test("returns null after a custom edit diverges from every template", () => {
    const config = applyPresswallTemplate("classic");

    expect(findMatchingPresswallTemplateId(config)).toBe("classic");

    const customized = { ...config, headingText: "Featured on" };

    expect(findMatchingPresswallTemplateId(customized)).toBeNull();
  });

  test("keeps the current template when only banner style changes", () => {
    const classic = getResolvedPresswallTemplateConfig("classic");
    const darkWithMarquee = {
      ...getResolvedPresswallTemplateConfig("dark"),
      layout: "marquee" as const,
      logoSpacing: "gap" as const,
    };

    expect(
      findMatchingPresswallTemplateId({
        ...classic,
        layout: "marquee",
        logoSpacing: "gap",
      })
    ).toBe("classic");
    expect(findMatchingPresswallTemplateId(darkWithMarquee)).toBe("dark");
  });
});

describe("getPresswallDesignLabel", () => {
  test("returns the template name when config still matches a template", () => {
    const config = getResolvedPresswallTemplateConfig("dark");

    expect(getPresswallDesignLabel(config)).toBe("Dark band");
  });

  test("returns Custom when config no longer matches any template", () => {
    const config = {
      ...getResolvedPresswallTemplateConfig("classic"),
      headingText: "Featured on",
    };

    expect(getPresswallDesignLabel(config)).toBe("Custom");
  });
});

describe("resolveOnboardingDesignConfig", () => {
  test("replaces stale legacy rows with the classic template", () => {
    const staleConfig = {
      ...DEFAULT_PRESSWALL_CONFIG,
      headingFontSize: 12,
      headingSpacing: 20,
    };

    expect(findMatchingPresswallTemplateId(staleConfig)).toBeNull();

    const resolved = resolveOnboardingDesignConfig(staleConfig);

    expect(findMatchingPresswallTemplateId(resolved)).toBe("classic");
  });
});
