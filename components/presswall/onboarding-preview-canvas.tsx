"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { OnboardingPreview } from "@/components/presswall/onboarding-preview";
import { getPreviewViewportWidth } from "@/lib/presswall-preview-viewport";
import type {
  PresswallConfig,
  PublisherCatalogItem,
  ShopCustomLogo,
  ShopPublisherSelection,
} from "@/lib/presswall-types";
import { cn } from "@/lib/utils";

type DeviceMode = "desktop" | "mobile";

interface OnboardingPreviewCanvasProps {
  catalog: PublisherCatalogItem[];
  config: PresswallConfig;
  customLogos?: ShopCustomLogo[];
  deviceMode: DeviceMode;
  selections: ShopPublisherSelection[];
}

const CANVAS_HORIZONTAL_PADDING = 48;

export function OnboardingPreviewCanvas({
  catalog,
  config,
  customLogos,
  deviceMode,
  selections,
}: OnboardingPreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContentHeight(entry.contentRect.height);
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const viewportWidth = getPreviewViewportWidth(deviceMode);
  const scale =
    containerWidth > 0
      ? Math.min(
          1,
          (containerWidth - CANVAS_HORIZONTAL_PADDING) / viewportWidth
        )
      : 1;
  const scaledWidth = viewportWidth * scale;
  const scaledHeight = contentHeight > 0 ? contentHeight * scale : undefined;
  const isReady = containerWidth > 0 && contentHeight > 0;

  return (
    <div
      className="presswall-canvas-bg-dots relative h-full w-full overflow-auto"
      ref={containerRef}
    >
      <div className="flex min-h-full items-center justify-center p-6">
        <div
          className={cn(!isReady && "opacity-0")}
          style={{
            height: scaledHeight,
            width: scaledWidth,
          }}
        >
          <div
            ref={contentRef}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: viewportWidth,
            }}
          >
            <OnboardingPreview
              catalog={catalog}
              className="border-black/10 shadow-sm"
              config={config}
              customLogos={customLogos}
              deviceMode={deviceMode}
              scale="lg"
              selections={selections}
            />
          </div>
        </div>
      </div>

      <p className="pointer-events-none absolute top-3 left-3 rounded-md border bg-background/90 px-2.5 py-1 text-[0.625rem] text-muted-foreground shadow-sm backdrop-blur-sm">
        {deviceMode === "desktop" ? "Desktop" : "Mobile"} · {viewportWidth}px
        wide
        {scale < 1 ? ` · scaled ${Math.round(scale * 100)}%` : null}
      </p>
    </div>
  );
}
