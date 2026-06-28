import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import type { PresswallConfig } from "@/lib/presswall-types";

export type PresswallTemplateId =
  | "classic"
  | "dark"
  | "marquee"
  | "grid"
  | "color"
  | "soft-card";

export interface PresswallTemplate {
  config: Partial<PresswallConfig>;
  description: string;
  id: PresswallTemplateId;
  name: string;
}

export const PRESSWALL_TEMPLATES: PresswallTemplate[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Centered bar with heading",
    config: {
      headingText: "As seen on",
      showHeading: true,
      colorMode: "mono",
      layout: "bar",
      alignment: "center",
      backgroundColor: "transparent",
      textColor: "#111111",
      borderRadius: 0,
      paddingY: 16,
      paddingX: 16,
      logoHeight: 32,
      gap: 24,
    },
  },
  {
    id: "dark",
    name: "Dark",
    description: "Dark strip with light text",
    config: {
      headingText: "As seen on",
      showHeading: true,
      colorMode: "mono",
      layout: "bar",
      alignment: "center",
      backgroundColor: "#0a0a0a",
      textColor: "#fafafa",
      borderRadius: 0,
      paddingY: 20,
      paddingX: 24,
      logoHeight: 32,
      gap: 24,
    },
  },
  {
    id: "marquee",
    name: "Scrolling",
    description: "Auto-scrolling logo strip",
    config: {
      showHeading: false,
      colorMode: "mono",
      layout: "marquee",
      alignment: "center",
      backgroundColor: "transparent",
      textColor: "#111111",
      borderRadius: 0,
      paddingY: 16,
      paddingX: 16,
      logoHeight: 28,
      gap: 32,
      marqueeSpeed: 30,
    },
  },
  {
    id: "grid",
    name: "Grid",
    description: "Muted logos in a grid",
    config: {
      headingText: "As seen on",
      showHeading: true,
      colorMode: "muted",
      layout: "grid",
      alignment: "center",
      backgroundColor: "transparent",
      textColor: "#111111",
      borderRadius: 0,
      paddingY: 20,
      paddingX: 16,
      logoHeight: 32,
      gap: 20,
      grayscaleOpacity: 70,
    },
  },
  {
    id: "color",
    name: "Color",
    description: "Full-color brand logos",
    config: {
      headingText: "As seen on",
      showHeading: true,
      colorMode: "color",
      layout: "bar",
      alignment: "center",
      backgroundColor: "transparent",
      textColor: "#111111",
      borderRadius: 0,
      paddingY: 16,
      paddingX: 16,
      logoHeight: 36,
      gap: 28,
    },
  },
  {
    id: "soft-card",
    name: "Soft card",
    description: "Rounded card with muted logos",
    config: {
      headingText: "Featured in",
      showHeading: true,
      colorMode: "muted",
      layout: "bar",
      alignment: "center",
      backgroundColor: "#f4f4f5",
      textColor: "#18181b",
      borderRadius: 12,
      paddingY: 24,
      paddingX: 24,
      logoHeight: 30,
      gap: 24,
      grayscaleOpacity: 65,
    },
  },
];

export const DEFAULT_PRESSWALL_TEMPLATE_ID: PresswallTemplateId = "classic";

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
  templateId: PresswallTemplateId,
  current: PresswallConfig = DEFAULT_PRESSWALL_CONFIG
): PresswallConfig {
  const template = getPresswallTemplate(templateId);
  return {
    ...DEFAULT_PRESSWALL_CONFIG,
    ...current,
    ...template.config,
  };
}
