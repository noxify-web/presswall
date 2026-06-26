"use client";

import {
  IconArrowRight,
  IconBuildingStore,
  IconPalette,
} from "@tabler/icons-react";
import { PublisherLogo } from "@/components/presswall/publisher-logo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  SelectedPublisher,
} from "@/lib/presswall-types";

const LAYOUT_LABELS: Record<PresswallConfig["layout"], string> = {
  bar: "Horizontal bar",
  grid: "Grid",
  marquee: "Scrolling marquee",
};

const COLOR_MODE_LABELS: Record<PresswallConfig["colorMode"], string> = {
  mono: "Black & white",
  muted: "Muted grayscale",
  color: "Full color",
};

interface PresswallOverviewProps {
  catalogById: Map<string, PublisherCatalogItem>;
  config: PresswallConfig;
  isLoading: boolean;
  onEditStyle: () => void;
  onOpenWizard: () => void;
  selected: SelectedPublisher[];
}

export function PresswallOverview({
  selected,
  catalogById,
  config,
  isLoading,
  onOpenWizard,
  onEditStyle,
}: PresswallOverviewProps) {
  const selectedLabels = selected.map((item) => {
    const publisher = item.publisherId
      ? catalogById.get(item.publisherId)
      : null;
    return {
      key: item.key,
      label: publisher?.name ?? item.customName ?? "Custom",
      customLogoSvg: item.customLogoSvg,
      publisherId: publisher?.id,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                  <IconBuildingStore stroke={2} />
                </div>
                <div>
                  <CardTitle>Outlets</CardTitle>
                  <CardDescription>
                    {selected.length} outlet{selected.length === 1 ? "" : "s"}{" "}
                    selected
                  </CardDescription>
                </div>
              </div>
              <Button
                disabled={isLoading}
                onClick={onOpenWizard}
                size="sm"
                variant="outline"
              >
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selected.length === 0 ? (
              <Empty className="border-dashed">
                <EmptyHeader>
                  <EmptyTitle>No outlets yet</EmptyTitle>
                  <EmptyDescription>
                    Open the setup wizard to pick outlets from the library.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedLabels.slice(0, 8).map((item) => (
                  <Badge
                    className="flex h-8 max-w-full items-center gap-2 px-2"
                    key={item.key}
                    variant="secondary"
                  >
                    <span className="flex h-4 w-10 shrink-0 items-center justify-center">
                      <PublisherLogo
                        className="[--logo-height:1rem]"
                        customLogoSvg={item.customLogoSvg}
                        name={item.label}
                        publisherId={item.publisherId}
                      />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Badge>
                ))}
                {selectedLabels.length > 8 ? (
                  <Badge variant="outline">
                    +{selectedLabels.length - 8} more
                  </Badge>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                  <IconPalette stroke={2} />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Heading, colors, and layout</CardDescription>
                </div>
              </div>
              <Button
                disabled={isLoading}
                onClick={onEditStyle}
                size="sm"
                variant="outline"
              >
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Heading</dt>
                <dd className="font-medium">
                  {config.showHeading ? config.headingText : "Hidden"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Layout</dt>
                <dd className="font-medium">{LAYOUT_LABELS[config.layout]}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Logo style</dt>
                <dd className="font-medium">
                  {COLOR_MODE_LABELS[config.colorMode]}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Alignment</dt>
                <dd className="font-medium capitalize">{config.alignment}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-sm">Configure your presswall</p>
            <p className="text-muted-foreground text-sm">
              Walk through outlet selection, styling, and a live preview in a
              guided setup.
            </p>
          </div>
          <Button disabled={isLoading} onClick={onOpenWizard} size="lg">
            Open setup wizard
            <IconArrowRight stroke={2} />
          </Button>
        </CardContent>
      </Card>

      <Alert>
        <AlertTitle>Add to your theme</AlertTitle>
        <AlertDescription>
          Use the activation banner above to enable the Presswall app embed, or
          add the section block from Online Store &rarr; Customize &rarr; Apps
          &rarr; Presswall.
        </AlertDescription>
      </Alert>
    </div>
  );
}
