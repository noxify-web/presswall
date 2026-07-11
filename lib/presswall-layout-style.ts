import type {
  PresswallAlignment,
  PresswallConfig,
} from "@/lib/presswall-types";
import { cn } from "@/lib/utils";

const logoRowAlignmentClass = {
  left: "justify-items-start",
  center: "justify-items-center",
  right: "justify-items-end",
} as const;

const logoBarAlignmentClass = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
} as const;

const marqueeAlignmentClass = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
} as const;

export type PresswallViewport = "desktop" | "mobile";

export function getLogosPerRow(
  config: Pick<PresswallConfig, "logosPerRowDesktop" | "logosPerRowMobile">,
  viewport: PresswallViewport = "desktop"
): number {
  return viewport === "mobile"
    ? config.logosPerRowMobile
    : config.logosPerRowDesktop;
}

/**
 * How many equal columns the bar grid should use.
 * Caps at logosPerRow so extras wrap; when there are fewer logos than the
 * configured row size, columns shrink so 2 logos still span the full width.
 */
export function getBarColumnCount(
  itemCount: number,
  logosPerRow: number
): number {
  const perRow = Math.max(1, Math.floor(logosPerRow));
  if (itemCount <= 0) {
    return perRow;
  }

  return Math.min(itemCount, perRow);
}

export function getLogosRowGridStyle(
  logosPerRow: number,
  gap: number
): React.CSSProperties {
  // Use longhand only — React warns if `gap` is mixed with columnGap/rowGap.
  return {
    columnGap: `${gap}px`,
    rowGap: `${gap}px`,
    gridTemplateColumns: `repeat(${logosPerRow}, minmax(0, 1fr))`,
    width: "100%",
  };
}

export function getLogosRowGridClassName(
  alignment: PresswallAlignment
): string {
  return cn("presswall-logo-row grid", logoRowAlignmentClass[alignment]);
}

export function usesDistributedLogoSpacing(
  config: Pick<PresswallConfig, "layout" | "logoSpacing">
): boolean {
  return config.layout === "bar" && config.logoSpacing === "space-between";
}

export function getLogosBarClassName(
  alignment: PresswallAlignment,
  logoSpacing: PresswallConfig["logoSpacing"]
): string {
  return cn(
    "presswall-logo-row flex w-full flex-wrap items-center",
    logoSpacing === "space-between"
      ? "justify-between"
      : logoBarAlignmentClass[alignment]
  );
}

export function getLogosBarStyle(
  gap: number,
  logoSpacing: PresswallConfig["logoSpacing"]
) {
  if (logoSpacing === "space-between") {
    return;
  }

  return { gap: `${gap}px` };
}

/**
 * Bar layouts always use an equal-column grid so long wordmarks are clipped
 * to their cell instead of overflowing onto neighbors (desktop + mobile).
 */
export function shouldConstrainBarRows(
  _viewport: PresswallViewport = "desktop"
): boolean {
  return true;
}

export function getLogosBarConstrainedClassName(
  alignment: PresswallAlignment
): string {
  return getLogosRowGridClassName(alignment);
}

/** Horizontal gap between mobile grid columns for space-between bars. */
export function getMobileSpaceBetweenColumnGap(gap: number): number {
  return Math.max(12, Math.round(gap * 0.5));
}

export function getLogosBarConstrainedStyle(
  logosPerRow: number,
  gap: number,
  logoSpacing: PresswallConfig["logoSpacing"]
): React.CSSProperties {
  if (logoSpacing === "space-between") {
    return {
      columnGap: `${getMobileSpaceBetweenColumnGap(gap)}px`,
      rowGap: `${gap}px`,
      gridTemplateColumns: `repeat(${logosPerRow}, minmax(0, 1fr))`,
      width: "100%",
    };
  }

  return getLogosRowGridStyle(logosPerRow, gap);
}

export function getMarqueeAlignmentClassName(
  alignment: PresswallAlignment
): string {
  return marqueeAlignmentClass[alignment];
}
