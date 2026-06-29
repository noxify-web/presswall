import type { PresswallViewport } from "@/lib/presswall-layout-style";

/** Extra horizontal inset on desktop so spread-evenly logos don't hug section edges. */
export const DESKTOP_SHELL_PADDING_X_BOOST = 20;

/** Default max width of the heading + logo row in pixels. */
export const DEFAULT_PRESSWALL_CONTENT_MAX_WIDTH = 840;

export function formatContentMaxWidth(
  contentMaxWidth = DEFAULT_PRESSWALL_CONTENT_MAX_WIDTH
): string {
  return `${contentMaxWidth}px`;
}

export function getEffectiveShellPaddingX(
  paddingX: number,
  viewport: PresswallViewport = "desktop"
): number {
  return viewport === "desktop"
    ? paddingX + DESKTOP_SHELL_PADDING_X_BOOST
    : paddingX;
}
