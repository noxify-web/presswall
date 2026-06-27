"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
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
  config: PresswallConfig;
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
      <Empty className="border-0 p-4">
        <EmptyHeader>
          <EmptyTitle>No outlets selected</EmptyTitle>
          <EmptyDescription>
            Pick outlets from the library to preview your presswall.
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
        "flex flex-wrap items-center gap-y-4",
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
    <div className="flex h-full flex-col">
      {/* Preview canvas area */}
      <div className="relative flex flex-1 items-center justify-center rounded-xl border bg-muted/20 p-6">
        {/* Simulated browser frame */}
        <div className="w-full max-w-2xl overflow-hidden rounded-lg border shadow-sm">
          {/* Browser chrome bar */}
          <div className="flex items-center gap-1.5 border-b bg-muted/50 px-3 py-2">
            <div className="size-2 rounded-full bg-muted-foreground/20" />
            <div className="size-2 rounded-full bg-muted-foreground/20" />
            <div className="size-2 rounded-full bg-muted-foreground/20" />
            <div className="mx-auto h-4 w-32 rounded-sm bg-muted-foreground/10" />
          </div>

          {/* Storefront preview content */}
          <div
            className="min-h-28 transition-colors duration-200"
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

            <LayoutContent
              config={config}
              items={items}
              renderLogo={renderLogo}
            />
          </div>
        </div>

        {/* Floating theme toggle */}
        <div className="absolute right-3 bottom-3 flex items-center gap-0.5 rounded-full border bg-background/90 p-0.5 shadow-sm backdrop-blur">
          <Button
            className="h-7 w-7 rounded-full"
            onClick={() => setTheme("light")}
            size="icon-sm"
            variant={theme === "light" ? "secondary" : "ghost"}
          >
            <IconSun className="size-3.5" stroke={2} />
          </Button>
          <Button
            className="h-7 w-7 rounded-full"
            onClick={() => setTheme("dark")}
            size="icon-sm"
            variant={theme === "dark" ? "secondary" : "ghost"}
          >
            <IconMoon className="size-3.5" stroke={2} />
          </Button>
        </div>
      </div>
    </div>
  );
}
