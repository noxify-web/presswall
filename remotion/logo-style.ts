import type { CSSProperties } from "react";
import type { TemplateDefinition } from "./template-data";

const DARK_BACKGROUND_LUMINANCE_THRESHOLD = 0.4;

function channelToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.039_28
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(red: number, green: number, blue: number): number {
  const linearRed = channelToLinear(red);
  const linearGreen = channelToLinear(green);
  const linearBlue = channelToLinear(blue);
  return 0.2126 * linearRed + 0.7152 * linearGreen + 0.0722 * linearBlue;
}

function parseHexColor(color: string): [number, number, number] | null {
  const hex = color.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)) {
    return null;
  }

  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex;

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function isTransparentBackground(backgroundColor: string): boolean {
  return backgroundColor.trim().toLowerCase() === "transparent";
}

function isDarkBackgroundColor(backgroundColor: string): boolean {
  const candidate = backgroundColor.trim().toLowerCase();
  if (isTransparentBackground(candidate)) {
    return false;
  }

  const rgb = parseHexColor(candidate);
  if (!rgb) {
    return false;
  }

  return relativeLuminance(...rgb) < DARK_BACKGROUND_LUMINANCE_THRESHOLD;
}

function shouldInvertLogos(template: TemplateDefinition): boolean {
  if (template.colorMode === "color") {
    return false;
  }

  if (isTransparentBackground(template.backgroundColor)) {
    return false;
  }

  return isDarkBackgroundColor(template.backgroundColor);
}

export function getPublisherLogoStyle(
  template: TemplateDefinition
): CSSProperties {
  const filters: string[] = [];

  if (template.colorMode === "mono" || template.colorMode === "muted") {
    filters.push("grayscale(100%)");
  }

  if (shouldInvertLogos(template)) {
    filters.push("invert(1)");
  }

  const style: CSSProperties = {};

  if (filters.length > 0) {
    style.filter = filters.join(" ");
  }

  if (template.colorMode === "muted") {
    style.opacity = 0.55;
  }

  return style;
}