import { describe, expect, test } from "bun:test";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import {
  applyPresswallTemplate,
  findMatchingPresswallTemplateId,
  getPresswallDesignLabel,
  getResolvedPresswallTemplateConfig,
} from "@/lib/presswall-templates";
import type { PresswallConfig } from "@/lib/presswall-types";

describe("applyPresswallTemplate", () => {
  test("resets omitted keys instead of carrying them from a prior config", () => {
    const editorial = getResolvedPresswallTemplateConfig("editorial");

    expect(editorial.grayscaleOpacity).toBe(60);

    const classic = applyPresswallTemplate("classic");

    expect(classic.grayscaleOpacity).toBe(
      DEFAULT_PRESSWALL_CONFIG.grayscaleOpacity
    );
    expect(findMatchingPresswallTemplateId(classic)).toBe("classic");
  });

  test("matches after switching templates from a customized current state", () => {
    const customized: PresswallConfig = {
      ...getResolvedPresswallTemplateConfig("grid"),
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
});

describe("getPresswallDesignLabel", () => {
  test("returns the template name when config still matches a template", () => {
    const config = getResolvedPresswallTemplateConfig("dark");

    expect(getPresswallDesignLabel(config)).toBe("Dark band");
  });

  test("returns Custom when config no longer matches any template", () => {
    const config = {
      ...getResolvedPresswallTemplateConfig("classic"),
      gap: 31,
    };

    expect(getPresswallDesignLabel(config)).toBe("Custom");
  });
});
