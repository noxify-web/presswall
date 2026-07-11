import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import { isDarkBackgroundColor } from "@/lib/presswall-logo-contrast";
import { withDerivedSpacing } from "@/lib/presswall-spacing";
import type { PresswallConfig } from "@/lib/presswall-types";

export type PresswallTemplateId = "classic" | "dark" | "marquee" | "soft-card";

export interface PresswallTemplate {
  config: Partial<PresswallConfig>;
  description: string;
  id: PresswallTemplateId;
  name: string;
}

const CLASSIC_BAR_TEMPLATE_BASE = {
  headingText: "As seen on",
  showHeading: true,
  colorMode: "black",
  layout: "bar",
  headingAlignment: "center",
  logoAlignment: "center",
  paddingY: 40,
  paddingX: 24,
  contentMaxWidth: 900,
  logoHeight: 28,
  headingFontSize: 12,
  logoSpacing: "space-between",
} as const satisfies Partial<PresswallConfig>;

export const PRESSWALL_TEMPLATES: PresswallTemplate[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Centered heading with a clean horizontal logo bar.",
    config: {
      ...CLASSIC_BAR_TEMPLATE_BASE,
      backgroundColor: "transparent",
      textColor: "#111111",
    },
  },
  {
    id: "dark",
    name: "Dark band",
    description:
      "Classic layout on a bold dark strip for light storefront pages.",
    config: {
      ...CLASSIC_BAR_TEMPLATE_BASE,
      colorMode: "white",
      backgroundColor: "#0a0a0a",
      textColor: "#fafafa",
    },
  },
  {
    id: "marquee",
    name: "Auto-scroll",
    description: "Continuous scroll — great when you have many outlets.",
    config: {
      headingText: "Featured in",
      showHeading: true,
      colorMode: "black",
      layout: "marquee",
      headingAlignment: "left",
      logoAlignment: "left",
      backgroundColor: "transparent",
      textColor: "#111111",
      headingFontSize: 12,
      paddingY: 32,
      paddingX: 16,
      logoHeight: 28,
      gap: 50,
      logoSpacing: "gap",
      marqueeSpeed: 30,
    },
  },
  {
    id: "soft-card",
    name: "Soft card",
    description: "Classic layout on a soft light-gray band.",
    config: {
      ...CLASSIC_BAR_TEMPLATE_BASE,
      backgroundColor: "#f4f4f5",
      textColor: "#111111",
    },
  },
];

export const DEFAULT_PRESSWALL_TEMPLATE_ID: PresswallTemplateId = "classic";

export function getConfigPreviewTheme(
  config: PresswallConfig
): "light" | "dark" {
  if (isDarkBackgroundColor(config.backgroundColor)) {
    return "dark";
  }
  return "light";
}

export function getTemplatePreviewTheme(
  templateId: PresswallTemplateId
): "light" | "dark" {
  return templateId === "dark" ? "dark" : "light";
}

export function resolveTemplateLogoSpacing(
  layout: PresswallConfig["layout"],
  explicit?: PresswallConfig["logoSpacing"]
): PresswallConfig["logoSpacing"] {
  if (layout === "marquee") {
    return "gap";
  }

  return explicit === "gap" ? "gap" : "space-between";
}

export function getPresswallTemplate(
  id: PresswallTemplateId
): PresswallTemplate {
  const template = PRESSWALL_TEMPLATES.find((item) => item.id === id);
  if (!template) {
    throw new Error(`Unknown presswall template: ${id}`);
  }
  return template;
}

export function applyPresswallTemplate(
  templateId: PresswallTemplateId
): PresswallConfig {
  const template = getPresswallTemplate(templateId);
  const explicitGap = template.config.gap;
  const explicitHeadingSpacing = template.config.headingSpacing;
  const resolved = withDerivedSpacing({
    ...DEFAULT_PRESSWALL_CONFIG,
    ...template.config,
  });

  return {
    ...resolved,
    ...(explicitGap === undefined ? {} : { gap: explicitGap }),
    ...(explicitHeadingSpacing === undefined
      ? {}
      : { headingSpacing: explicitHeadingSpacing }),
    logoSpacing: resolveTemplateLogoSpacing(
      resolved.layout,
      template.config.logoSpacing
    ),
  };
}

const PRESSWALL_CONFIG_KEYS = Object.keys(
  DEFAULT_PRESSWALL_CONFIG
) as (keyof PresswallConfig)[];

const TEMPLATE_MATCH_IGNORED_KEYS = new Set<keyof PresswallConfig>([
  "layout",
  "logoSpacing",
  "gap",
  "marqueeSpeed",
]);

export function presswallConfigsEqual(
  left: PresswallConfig,
  right: PresswallConfig
): boolean {
  return PRESSWALL_CONFIG_KEYS.every((key) => left[key] === right[key]);
}

export function presswallTemplateConfigsEqual(
  left: PresswallConfig,
  right: PresswallConfig
): boolean {
  return PRESSWALL_CONFIG_KEYS.every(
    (key) => TEMPLATE_MATCH_IGNORED_KEYS.has(key) || left[key] === right[key]
  );
}

export function getResolvedPresswallTemplateConfig(
  templateId: PresswallTemplateId
): PresswallConfig {
  return applyPresswallTemplate(templateId);
}

export function findMatchingPresswallTemplateId(
  config: PresswallConfig
): PresswallTemplateId | null {
  for (const template of PRESSWALL_TEMPLATES) {
    if (
      presswallTemplateConfigsEqual(
        config,
        getResolvedPresswallTemplateConfig(template.id)
      )
    ) {
      return template.id;
    }
  }

  return null;
}

/** During onboarding, stale DB rows may look like Classic but use old typography. */
export function resolveOnboardingDesignConfig(
  config: PresswallConfig
): PresswallConfig {
  if (findMatchingPresswallTemplateId(config)) {
    return config;
  }

  return applyPresswallTemplate(DEFAULT_PRESSWALL_TEMPLATE_ID);
}

export function getPresswallDesignLabel(config: PresswallConfig): string {
  const matchedTemplateId = findMatchingPresswallTemplateId(config);
  if (!matchedTemplateId) {
    return "Custom";
  }

  return getPresswallTemplate(matchedTemplateId).name;
}
