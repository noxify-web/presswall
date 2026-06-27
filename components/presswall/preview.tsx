"use client";

import { IconEye, IconMoon, IconSun } from "@tabler/icons-react";
import { useState } from "react";
import { PublisherLogo } from "@/components/presswall/publisher-logo";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { getLogoImageStyle } from "@/lib/presswall-logo-style";
import type {
  PresswallConfig,
  PublisherCatalogItem,
  ShopPublisherSelection,
  StorefrontPublisher,
} from "@/lib/presswall-types";
import { resolveStorefrontPublishers } from "@/lib/resolve-storefront-publishers";
import { cn } from "@/lib/utils";

interface PreviewProps {
  catalog: PublisherCatalogItem[];
  compact?: boolean;
  config: PresswallConfig;
  isLoading?: boolean;
  selections: ShopPublisherSelection[];
}

const alignmentClass = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
} as const;

function getContainerBg(config: PresswallConfig, isDark: boolean): string {
  if (config.backgroundColor === "transparent") {
    return isDark ? "#111111" : "#ffffff";
  }
  return config.backgroundColor;
}

function LayoutContent({
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
      <Empty className="border-0 p-6">
        <EmptyHeader>
          <EmptyTitle>No outlets yet</EmptyTitle>
          <EmptyDescription>
            Select outlets to see your presswall here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (config.layout === "marquee") {
    return (
      <div className="overflow-hidden">
        <div
          className="presswall-marquee flex w-max items-center"
          style={{
            gap: `${config.gap}px`,
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
        className="grid grid-cols-2 sm:grid-cols-3"
        style={{ gap: `${config.gap}px` }}
      >
        {items.map((item) => (
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
        "flex flex-wrap items-center gap-y-3",
        alignmentClass[config.alignment]
      )}
      style={{ gap: `${config.gap}px` }}
    >
      {items.map((item) => renderLogo(item))}
    </div>
  );
}

export function PresswallPreview({
  config,
  catalog,
  selections,
  compact = false,
  isLoading = false,
}: PreviewProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const items = resolveStorefrontPublishers(config, catalog, selections);
  const isDark = theme === "dark";
  const logoStyle = getLogoImageStyle(config);

  const containerStyle = {
    backgroundColor: getContainerBg(config, isDark),
    color: config.textColor,
    borderRadius: `${config.borderRadius}px`,
    padding: `${config.paddingY}px ${config.paddingX}px`,
  } satisfies React.CSSProperties;

  const renderLogo = (item: StorefrontPublisher) => {
    const logoContainerStyle = {
      ...logoStyle,
      "--logo-height": `${config.logoHeight}px`,
      height: `${config.logoHeight}px`,
      maxWidth: "140px",
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

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        compact && "rounded-lg border bg-card p-3"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <IconEye className="size-3.5 text-muted-foreground" stroke={2} />
          <span className="font-medium text-sm">Preview</span>
        </div>
        <div className="flex rounded-md border p-0.5">
          <Button
            aria-label="Light preview"
            className="h-6 px-2"
            onClick={() => setTheme("light")}
            size="sm"
            variant={theme === "light" ? "secondary" : "ghost"}
          >
            <IconSun className="size-3.5" stroke={2} />
          </Button>
          <Button
            aria-label="Dark preview"
            className="h-6 px-2"
            onClick={() => setTheme("dark")}
            size="sm"
            variant={theme === "dark" ? "secondary" : "ghost"}
          >
            <IconMoon className="size-3.5" stroke={2} />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "rounded-lg border transition-opacity",
          compact ? "min-h-36" : "min-h-32",
          isDark ? "border-white/10" : "border-black/10",
          isLoading && "animate-pulse opacity-60"
        )}
        style={containerStyle}
      >
        {config.showHeading && config.headingText ? (
          <p
            className="mb-3 font-medium text-[10px] uppercase tracking-[0.24em] opacity-80"
            style={{ color: config.textColor }}
          >
            {config.headingText}
          </p>
        ) : null}

        <LayoutContent config={config} items={items} renderLogo={renderLogo} />
      </div>
    </div>
  );
}
