export type TemplateId = "classic" | "dark" | "marquee" | "soft-card";

export interface TemplateDefinition {
  backgroundColor: string;
  colorMode: "color" | "mono" | "muted";
  headingAlignment: "center" | "left";
  headingText: string;
  id: TemplateId;
  layout: "bar" | "marquee";
  logoSpacing: "gap" | "space-between";
  marqueeGap?: number;
  marqueeSpeed?: number;
  name: string;
  textColor: string;
}

/** Four logos with generous spacing in template previews. */
export const SHOWCASE_PUBLISHERS = [
  "forbes",
  "techcrunch",
  "wired",
  "bloomberg",
] as const;

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "classic",
    name: "Classic",
    headingText: "As seen on",
    backgroundColor: "transparent",
    textColor: "#111111",
    colorMode: "mono",
    layout: "bar",
    headingAlignment: "center",
    logoSpacing: "space-between",
  },
  {
    id: "dark",
    name: "Dark band",
    headingText: "As seen on",
    backgroundColor: "#0a0a0a",
    textColor: "#fafafa",
    colorMode: "mono",
    layout: "bar",
    headingAlignment: "center",
    logoSpacing: "space-between",
  },
  {
    id: "marquee",
    name: "Auto-scroll",
    headingText: "Featured in",
    backgroundColor: "transparent",
    textColor: "#111111",
    colorMode: "mono",
    layout: "marquee",
    headingAlignment: "left",
    logoSpacing: "gap",
    marqueeGap: 64,
    marqueeSpeed: 2.5,
  },
  {
    id: "soft-card",
    name: "Soft card",
    headingText: "As seen on",
    backgroundColor: "#f4f4f5",
    textColor: "#111111",
    colorMode: "mono",
    layout: "bar",
    headingAlignment: "center",
    logoSpacing: "space-between",
  },
];

export const FEATURES = [
  {
    title: "Pick outlets",
    body: "Curated press logos — or upload your own",
  },
  {
    title: "Style the strip",
    body: "Templates, colors, layout, and marquee speed",
  },
  {
    title: "Go live",
    body: "Theme app embed — live on your storefront",
  },
] as const;
