"use client";

import { IconArrowDown, IconArrowUp, IconX } from "@tabler/icons-react";
import { PublisherLogo } from "@/components/presswall/publisher-logo";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  PublisherCatalogItem,
  SelectedPublisher,
} from "@/lib/presswall-types";
import { cn } from "@/lib/utils";

interface SelectedOutletsProps {
  catalogById: Map<string, PublisherCatalogItem>;
  className?: string;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (key: string) => void;
  selected: SelectedPublisher[];
}

export function SelectedOutlets({
  selected,
  catalogById,
  onMove,
  onRemove,
  className,
}: SelectedOutletsProps) {
  if (selected.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed",
          className
        )}
      >
        <Empty className="border-0 py-8">
          <EmptyHeader>
            <EmptyTitle>Nothing selected yet</EmptyTitle>
            <EmptyDescription>
              Pick outlets from the library to build your lineup.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("rounded-lg border", className)}>
      <div className="flex flex-col gap-1 p-1.5">
        {selected.map((item, index) => {
          const publisher = item.publisherId
            ? catalogById.get(item.publisherId)
            : null;
          const label = publisher?.name ?? item.customName ?? "Custom";
          const customLogoSvg = item.customLogoSvg;

          return (
            <div
              className="group flex items-center gap-2 rounded-md border border-transparent bg-muted/20 px-2 py-1.5 hover:border-border"
              key={item.key}
            >
              <span className="w-4 shrink-0 text-center font-medium text-muted-foreground text-xs tabular-nums">
                {index + 1}
              </span>

              <div className="flex h-5 w-16 shrink-0 items-center justify-center">
                <PublisherLogo
                  className="[--logo-height:1.125rem]"
                  customLogoSvg={customLogoSvg}
                  name={label}
                  publisherId={publisher?.id}
                />
              </div>

              <span className="min-w-0 flex-1 truncate text-sm">{label}</span>

              <div className="flex shrink-0 items-center opacity-70 transition-opacity group-hover:opacity-100">
                <Button
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => onMove(index, -1)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <IconArrowUp className="size-3.5" stroke={2} />
                </Button>
                <Button
                  aria-label="Move down"
                  disabled={index === selected.length - 1}
                  onClick={() => onMove(index, 1)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <IconArrowDown className="size-3.5" stroke={2} />
                </Button>
                <Button
                  aria-label="Remove"
                  onClick={() => onRemove(item.key)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <IconX
                    className="size-3.5 text-muted-foreground"
                    stroke={2}
                  />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
