"use client";

import { PresswallStrip } from "@/components/presswall/strip-content";
import { usePresswallStripItems } from "@/hooks/use-presswall-strip-items";
import { usesInlineMarqueeHeading } from "@/lib/presswall-heading-rules";
import {
  getLogosPerRow,
  type PresswallViewport,
} from "@/lib/presswall-layout-style";
import { getLogoImageStyle } from "@/lib/presswall-logo-style";
import { getPreviewColors } from "@/lib/presswall-preview-colors";
import {
  formatContentMaxWidth,
  getEffectiveShellPaddingX,
} from "@/lib/presswall-shell-padding";
import { scaleSpacingForPreview } from "@/lib/presswall-spacing";
import type {
  PresswallConfig,
  PublisherCatalogItem,
  ShopCustomLogo,
  ShopPublisherSelection,
} from "@/lib/presswall-types";
import { cn } from "@/lib/utils";

interface OnboardingPreviewProps {
  catalog: PublisherCatalogItem[];
  className?: string;
  config: PresswallConfig;
  customLogos?: ShopCustomLogo[];
  deviceMode?: PresswallViewport;
  previewTheme?: "light" | "dark";
  scale?: "sm" | "md" | "lg";
  selections: ShopPublisherSelection[];
}

/** ~25% smaller than the previous template thumbnail caps. */
const TEMPLATE_THUMBNAIL_LOGO_HEIGHT_CAP = 12;
const TEMPLATE_THUMBNAIL_LOGO_MAX_WIDTH = 42;
const TEMPLATE_THUMBNAIL_PADDING_CAP = 9;

const onboardingEmptyState = (
  <div className="flex h-8 items-center justify-center text-[10px] text-muted-foreground/70">
    Select outlets to preview
  </div>
);

function usesContainedPreviewLayout(
  config: PresswallConfig,
  isLivePreview: boolean
): boolean {
  if (!isLivePreview) {
    return false;
  }

  return config.layout !== "marquee" || !usesInlineMarqueeHeading(config);
}

function getPreviewLogoMaxWidth(
  config: PresswallConfig,
  isLivePreview: boolean,
  isTemplateThumbnail: boolean
): number {
  if (isLivePreview) {
    return Math.round(config.logoHeight * 3);
  }

  if (isTemplateThumbnail) {
    return TEMPLATE_THUMBNAIL_LOGO_MAX_WIDTH;
  }

  return 56;
}

export function OnboardingPreview({
  catalog,
  config,
  customLogos,
  selections,
  className,
  deviceMode,
  scale = "md",
  previewTheme = "light",
}: OnboardingPreviewProps) {
  const isDark = previewTheme === "dark";
  const previewColors = getPreviewColors(config, isDark);
  const logoStyle = getLogoImageStyle(config, { previewIsDark: isDark });
  const isLivePreview = scale === "lg" && deviceMode !== undefined;
  const isTemplateThumbnail = scale === "sm";

  const viewport = deviceMode ?? "desktop";
  const logosPerRow = getLogosPerRow(config, viewport);
  const logoHeight = isLivePreview
    ? config.logoHeight
    : Math.min(
        config.logoHeight,
        isTemplateThumbnail ? TEMPLATE_THUMBNAIL_LOGO_HEIGHT_CAP : 16
      );
  const gap = isLivePreview
    ? config.gap
    : scaleSpacingForPreview(config.gap, config.logoHeight, logoHeight);
  const paddingY = isLivePreview
    ? config.paddingY
    : Math.min(
        config.paddingY,
        isTemplateThumbnail ? TEMPLATE_THUMBNAIL_PADDING_CAP : 12
      );
  const paddingX = isLivePreview
    ? getEffectiveShellPaddingX(config.paddingX, viewport)
    : Math.min(
        config.paddingX,
        isTemplateThumbnail ? TEMPLATE_THUMBNAIL_PADDING_CAP : 12
      );

  const logoMaxWidth = getPreviewLogoMaxWidth(
    config,
    isLivePreview,
    isTemplateThumbnail
  );
  const usesContainedLayout = usesContainedPreviewLayout(config, isLivePreview);

  const { items, renderLogo } = usePresswallStripItems({
    catalog,
    customLogos,
    logoHeight,
    logoMaxWidth,
    logoStyle,
    selections,
  });

  const staticLimit =
    isTemplateThumbnail && config.layout !== "marquee"
      ? logosPerRow * 2
      : undefined;

  return (
    <div
      className={cn("w-full overflow-hidden rounded-xl border", className)}
      style={{
        backgroundColor: previewColors.backgroundColor,
        color: previewColors.textColor,
        borderRadius: `${config.borderRadius}px`,
        padding: `${paddingY}px ${paddingX}px`,
      }}
    >
      <div
        className={cn(usesContainedLayout && "mx-auto w-full")}
        style={
          usesContainedLayout
            ? { maxWidth: formatContentMaxWidth(config.contentMaxWidth) }
            : undefined
        }
      >
        <PresswallStrip
          backgroundColor={previewColors.backgroundColor}
          config={{ ...config, gap }}
          emptyState={onboardingEmptyState}
          headingOptions={{
            compact: !isLivePreview,
            compactFontSizeCap: isTemplateThumbnail ? 6 : 8,
          }}
          items={items}
          logosPerRow={logosPerRow}
          renderLogo={renderLogo}
          staticLayoutItemLimit={staticLimit}
          textColor={previewColors.textColor}
          viewport={viewport}
        />
      </div>
    </div>
  );
}
