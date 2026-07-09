"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  type Node,
  type NodeProps,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import { useEffect, useMemo } from "react";
import { OnboardingPreview } from "@/components/presswall/onboarding-preview";
import { PreviewLogoStyleToggle } from "@/components/presswall/preview-logo-style-toggle";
import { getPreviewViewportWidth } from "@/lib/presswall-preview-viewport";
import type {
  PresswallConfig,
  PublisherCatalogItem,
  ShopCustomLogo,
  ShopPublisherSelection,
} from "@/lib/presswall-types";

import "@xyflow/react/dist/style.css";

type DeviceMode = "desktop" | "mobile";

interface OnboardingPreviewCanvasProps {
  catalog: PublisherCatalogItem[];
  config: PresswallConfig;
  customLogos?: ShopCustomLogo[];
  deviceMode: DeviceMode;
  /** When set, shows Color / Black / White in the canvas corner. */
  onColorModeChange?: (value: PresswallConfig["colorMode"]) => void;
  /** Editor: hover a logo → change control opens the replace picker. */
  onReplaceLogoAt?: (selectionIndex: number) => void;
  selections: ShopPublisherSelection[];
  showViewportHint?: boolean;
}

interface PreviewNodeData extends Record<string, unknown> {
  catalog: PublisherCatalogItem[];
  config: PresswallConfig;
  customLogos?: ShopCustomLogo[];
  deviceMode: DeviceMode;
  onReplaceLogoAt?: (selectionIndex: number) => void;
  selections: ShopPublisherSelection[];
  viewportWidth: number;
}

const PREVIEW_NODE_ID = "presswall-preview";
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;
const FIT_PADDING = 0.18;

function PreviewStripNode({ data }: NodeProps<Node<PreviewNodeData>>) {
  return (
    <div
      className={
        data.onReplaceLogoAt ? "select-none" : "pointer-events-none select-none"
      }
      style={{ width: data.viewportWidth }}
    >
      <OnboardingPreview
        catalog={data.catalog}
        className="border-black/10 shadow-sm"
        config={data.config}
        customLogos={data.customLogos}
        deviceMode={data.deviceMode}
        onReplaceLogoAt={data.onReplaceLogoAt}
        scale="lg"
        selections={data.selections}
      />
    </div>
  );
}

const nodeTypes = {
  preview: PreviewStripNode,
};

function PreviewCanvasFlow({
  catalog,
  config,
  customLogos,
  deviceMode,
  onReplaceLogoAt,
  selections,
}: Omit<
  OnboardingPreviewCanvasProps,
  "onColorModeChange" | "showViewportHint"
>) {
  const { fitView } = useReactFlow();
  const viewportWidth = getPreviewViewportWidth(deviceMode);

  const nodes = useMemo<Node<PreviewNodeData>[]>(
    () => [
      {
        id: PREVIEW_NODE_ID,
        type: "preview",
        position: { x: 0, y: 0 },
        data: {
          catalog,
          config,
          customLogos,
          deviceMode,
          onReplaceLogoAt,
          selections,
          viewportWidth,
        },
        draggable: false,
        selectable: false,
        focusable: false,
      },
    ],
    [
      catalog,
      config,
      customLogos,
      deviceMode,
      onReplaceLogoAt,
      selections,
      viewportWidth,
    ]
  );

  useEffect(() => {
    const animate = deviceMode === "desktop" || deviceMode === "mobile";
    const timer = window.setTimeout(() => {
      fitView({
        padding: FIT_PADDING,
        duration: animate ? 200 : 0,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
      });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [deviceMode, fitView]);

  return (
    <ReactFlow
      className="presswall-preview-flow h-full w-full"
      colorMode="light"
      defaultEdgeOptions={{ hidden: true }}
      deleteKeyCode={null}
      elementsSelectable={false}
      fitView
      fitViewOptions={{ padding: FIT_PADDING }}
      maxZoom={MAX_ZOOM}
      minZoom={MIN_ZOOM}
      multiSelectionKeyCode={null}
      nodes={nodes}
      nodesConnectable={false}
      nodesDraggable={false}
      nodeTypes={nodeTypes}
      panOnDrag
      panOnScroll={false}
      preventScrolling
      proOptions={{ hideAttribution: true }}
      selectionKeyCode={null}
      zoomOnDoubleClick
      zoomOnPinch
      zoomOnScroll
    >
      {/* Built-in React Flow dotted canvas (pans/zooms with the viewport). */}
      <Background
        bgColor="#f4f4f5"
        color="#a1a1aa"
        gap={16}
        size={1.5}
        variant={BackgroundVariant.Dots}
      />
      <Controls
        className="presswall-preview-flow-controls overflow-hidden rounded-md border bg-background/95 shadow-sm"
        fitViewOptions={{ padding: FIT_PADDING }}
        position="bottom-right"
        showInteractive={false}
      />
    </ReactFlow>
  );
}

export function OnboardingPreviewCanvas({
  onColorModeChange,
  showViewportHint = true,
  ...props
}: OnboardingPreviewCanvasProps) {
  const viewportWidth = getPreviewViewportWidth(props.deviceMode);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <ReactFlowProvider>
        <PreviewCanvasFlow {...props} />
      </ReactFlowProvider>

      {showViewportHint ? (
        <p className="pointer-events-none absolute top-3 left-3 z-10 rounded-md border bg-background/90 px-2.5 py-1 text-[0.625rem] text-muted-foreground shadow-sm backdrop-blur-sm">
          {props.deviceMode === "desktop" ? "Desktop" : "Mobile"} ·{" "}
          {viewportWidth}px
        </p>
      ) : null}

      {onColorModeChange ? (
        <div className="absolute bottom-3 left-3 z-10">
          <PreviewLogoStyleToggle
            onChange={onColorModeChange}
            value={props.config.colorMode}
          />
        </div>
      ) : null}
    </div>
  );
}
