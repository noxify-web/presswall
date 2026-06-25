import { z } from "zod";

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_COLOR = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;

export function isSafeCssColor(value: string): boolean {
  if (value === "transparent") {
    return true;
  }

  if (HEX_COLOR.test(value)) {
    return true;
  }

  const rgbMatch = RGB_COLOR.exec(value);
  if (!rgbMatch) {
    return false;
  }

  return rgbMatch.slice(1, 4).every((channel) => Number(channel) <= 255);
}

export const cssColorSchema = z
  .string()
  .max(32)
  .refine(isSafeCssColor, { message: "Invalid color value" });

export function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const safeHttpUrlSchema = z
  .string()
  .url({ message: "Invalid URL" })
  .refine(isSafeHttpUrl, { message: "URL must use http or https" })
  .or(z.literal(""));

export const MAX_CUSTOM_LOGO_SVG_LENGTH = 50_000;
