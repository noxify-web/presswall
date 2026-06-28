"use client";

import { PublisherLogo } from "@/components/presswall/publisher-logo";
import { getLogoImageStyle } from "@/lib/presswall-logo-style";
import {
  getPreviewColors,
  shouldInvertLogosForPreview,
} from "@/lib/presswall-preview-colors";
import type {
  PresswallConfig,
  PublisherCatalogItem,
  ShopPublisherSelection,
  StorefrontPublisher,
} from "@/lib/presswall-types";
import { resolveStorefrontPublishers } from "@/lib/resolve-storefront-publishers";
import { cn } from "@/lib/utils";

interface OnboardingPreviewProps {
  catalog: PublisherCatalogItem[];
  className?: string;
  config: PresswallConfig;
  previewTheme?: "light" | "dark";
  scale?: "sm" | "md" | "lg";
  selections: ShopPublisherSelection[];
}

const alignmentClass = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
} as const;

function PreviewLogos({
  config,
  items,
  renderLogo,
}: {
  config: PresswallConfig;
  items: ReturnType<typeof resolveStorefrontPublishers>;
  renderLogo: (item: StorefrontPublisher) => React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <div className="flex h-8 items-center justify-center text-[10px] text-muted-foreground/70">
        Select outlets to preview
      </div>
    );
  }

  if (config.layout === "marquee") {
    return (
      <div className="overflow-hidden">
        <div
          className="presswall-marquee flex w-max items-center"
          style={{
            gap: `${Math.min(config.gap, 20)}px`,
            animationDuration: `${config.marqueeSpeed}s`,
          }}
        >
          {items
            .map((item) => ({ item, suffix: "a" as string }))
            .concat(items.map((item) => ({ item, suffix: "b" as string })))
            .map(({ item, suffix }) => (
              <div key={`${item.id}-${suffix}`}>{renderLogo(item)}</div>
            ))}
        </div>
      </div>
    );
  }

  if (config.layout === "grid") {
    return (
      <div
        className="grid grid-cols-3"
        style={{ gap: `${Math.min(config.gap, 16)}px` }}
      >
        {items.slice(0, 6).map((item) => (
          <div className="flex items-center justify-center" key={item.id}>
            {renderLogo(item)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center",
        alignmentClass[config.alignment]
      )}
      style={{ gap: `${Math.min(config.gap, 20)}px` }}
    >
      {items.slice(0, 5).map((item) => renderLogo(item))}
    </div>
  );
}

export function OnboardingPreview({
  catalog,
  config,
  selections,
  className,
  scale = "md",
  previewTheme = "light",
}: OnboardingPreviewProps) {
  const items = resolveStorefrontPublishers(config, catalog, selections);
  const isDark = previewTheme === "dark";
  const previewColors = getPreviewColors(config, isDark);
  const invertLogos = shouldInvertLogosForPreview(config, isDark);
  const logoStyle = getLogoImageStyle(config);

  const logoHeight =
    scale === "sm" ? Math.min(config.logoHeight, 20) : config.logoHeight;

  const renderLogo = (item: StorefrontPublisher) => {
    const logoFilters = [
      logoStyle?.filter,
      invertLogos ? "invert(1)" : undefined,
    ]
      .filter(Boolean)
      .join(" ");

    const logoContainerStyle = {
      ...logoStyle,
      ...(logoFilters ? { filter: logoFilters } : {}),
      "--logo-height": `${logoHeight}px`,
      height: `${logoHeight}px`,
      maxWidth: scale === "sm" ? "72px" : "120px",
    } as React.CSSProperties;

    return (
      <PublisherLogo
        className="flex shrink-0 items-center"
        customLogoSvg={item.isCustom ? item.logoSvg || undefined : undefined}
        key={item.id}
        logoImageUrl={item.logoImageUrl}
        name={item.name}
        publisherId={item.isCustom ? undefined : item.id}
        style={logoContainerStyle}
      />
    );
  };

  const paddingY =
    scale === "sm" ? Math.min(config.paddingY, 12) : config.paddingY;
  const paddingX =
    scale === "sm" ? Math.min(config.paddingX, 12) : config.paddingX;

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
      {config.showHeading && config.headingText ? (
        <p
          className={cn(
            "font-medium uppercase tracking-[0.28em]",
            scale === "sm" ? "mb-2 text-[8px]" : "mb-3 text-[10px]"
          )}
          style={{ color: previewColors.textColor }}
        >
          {config.headingText}
        </p>
      ) : null}

      <PreviewLogos config={config} items={items} renderLogo={renderLogo} />
    </div>
  );
}
