"use client";

import {
  IconArrowDown,
  IconArrowUp,
  IconGripVertical,
  IconX,
} from "@tabler/icons-react";
import { PublisherLogo } from "@/components/presswall/publisher-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import type {
  PublisherCatalogItem,
  SelectedPublisher,
} from "@/lib/presswall-types";

interface SelectedOutletsProps {
  catalogById: Map<string, PublisherCatalogItem>;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (key: string) => void;
  selected: SelectedPublisher[];
}

export function SelectedOutlets({
  selected,
  catalogById,
  onMove,
  onRemove,
}: SelectedOutletsProps) {
  if (selected.length === 0) {
    return (
      <Empty className="border-dashed">
        <EmptyHeader>
          <EmptyTitle>No outlets selected</EmptyTitle>
          <EmptyDescription>
            Pick outlets from the library above or add a custom one.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {selected.map((item, index) => {
        const publisher = item.publisherId
          ? catalogById.get(item.publisherId)
          : null;
        const label = publisher?.name ?? item.customName ?? "Custom";
        const customLogoSvg = item.customLogoSvg;

        return (
          <div
            className="group flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors hover:bg-muted/30"
            key={item.key}
          >
            <IconGripVertical
              className="size-3.5 shrink-0 text-muted-foreground/50"
              stroke={2}
            />

            <Badge
              className="h-5 min-w-5 justify-center px-1 text-[0.625rem] tabular-nums"
              variant="secondary"
            >
              {index + 1}
            </Badge>

            <div className="flex h-5 w-20 shrink-0 items-center justify-center px-0.5">
              <PublisherLogo
                className="[--logo-height:1rem]"
                customLogoSvg={customLogoSvg}
                name={label}
                publisherId={publisher?.id}
              />
            </div>

            <span className="min-w-0 flex-1 truncate font-medium text-xs">
              {label}
            </span>

            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                disabled={index === 0}
                onClick={() => onMove(index, -1)}
                size="icon-sm"
                variant="ghost"
              >
                <IconArrowUp className="size-3.5" stroke={2} />
              </Button>
              <Button
                disabled={index === selected.length - 1}
                onClick={() => onMove(index, 1)}
                size="icon-sm"
                variant="ghost"
              >
                <IconArrowDown className="size-3.5" stroke={2} />
              </Button>
              <Button
                onClick={() => onRemove(item.key)}
                size="icon-sm"
                variant="ghost"
              >
                <IconX className="size-3.5 text-muted-foreground" stroke={2} />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
