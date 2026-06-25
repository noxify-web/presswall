"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import type {
  PresswallConfig,
  PublisherCatalogItem,
  ShopPublisherSelection,
} from "@/lib/presswall-types";
import { resolveStorefrontPublishers } from "@/lib/resolve-storefront-publishers";

type PreviewProps = {
  config: PresswallConfig;
  catalog: PublisherCatalogItem[];
  selections: ShopPublisherSelection[];
  theme?: "light" | "dark";
};

export function PresswallPreview({
  config,
  catalog,
  selections,
  theme = "light",
}: PreviewProps) {
  const items = resolveStorefrontPublishers(config, catalog, selections);
  const isDark = theme === "dark";

  const alignmentClass =
    config.alignment === "left"
      ? "justify-start"
      : config.alignment === "right"
        ? "justify-end"
        : "justify-center";

  const logoStyle =
    config.colorMode === "muted"
      ? {
          filter: `grayscale(100%) opacity(${config.grayscaleOpacity / 100})`,
        }
      : config.colorMode === "mono"
        ? { filter: "grayscale(100%)" }
        : undefined;

  const containerStyle = {
    backgroundColor:
      config.backgroundColor === "transparent"
        ? isDark
          ? "#111111"
          : "#ffffff"
        : config.backgroundColor,
    color: config.textColor,
    borderRadius: `${config.borderRadius}px`,
    padding: `${config.paddingY}px ${config.paddingX}px`,
  };

  const renderLogo = (item: { id: string; name: string; logoSvg: string }) => {
    if (!item.logoSvg) {
      return (
        <Badge key={item.id} variant="outline">
          {item.name}
        </Badge>
      );
    }

    return (
      <div
        className="flex shrink-0 items-center [&_svg]:h-full [&_svg]:w-auto"
        dangerouslySetInnerHTML={{ __html: item.logoSvg }}
        key={item.id}
        style={{
          ...logoStyle,
          height: `${config.logoHeight}px`,
          maxWidth: "140px",
        }}
      />
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Live preview</CardTitle>
            <CardDescription>
              How your presswall will look on the storefront.
            </CardDescription>
          </div>
          <Badge variant="secondary">{theme}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`rounded-lg border ${isDark ? "border-white/10" : "border-black/10"}`}
          style={containerStyle}
        >
          {config.showHeading && config.headingText ? (
            <p
              className="mb-4 font-medium text-[11px] uppercase tracking-[0.28em]"
              style={{ color: config.textColor }}
            >
              {config.headingText}
            </p>
          ) : null}

          {items.length === 0 ? (
            <Empty className="border-0 p-4">
              <EmptyHeader>
                <EmptyTitle>No outlets selected</EmptyTitle>
                <EmptyDescription>
                  Pick publishers from the library to preview your presswall.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : config.layout === "marquee" ? (
            <div className="overflow-hidden">
              <div
                className="presswall-marquee flex w-max items-center"
                style={{
                  gap: `${config.gap}px`,
                  animationDuration: `${config.marqueeSpeed}s`,
                }}
              >
                {[...items, ...items].map((item, index) => (
                  <div key={`${item.id}-${index}`}>{renderLogo(item)}</div>
                ))}
              </div>
            </div>
          ) : config.layout === "grid" ? (
            <div
              className="grid grid-cols-2 sm:grid-cols-3"
              style={{ gap: `${config.gap}px` }}
            >
              {items.map((item) => (
                <div className="flex items-center justify-center" key={item.id}>
                  {renderLogo(item)}
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`flex flex-wrap items-center gap-y-4 ${alignmentClass}`}
              style={{ gap: `${config.gap}px` }}
            >
              {items.map((item) => renderLogo(item))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
