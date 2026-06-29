"use client";

import { IconPhotoUp, IconSearch, IconX } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { CustomOutletForm } from "@/components/presswall/custom-outlet-form";
import { PublisherLogo } from "@/components/presswall/publisher-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  PublisherCatalogItem,
  SelectedPublisher,
} from "@/lib/presswall-types";
import { PUBLISHER_CATEGORIES } from "@/lib/publishers-seed";
import { cn } from "@/lib/utils";

interface OutletLibraryPanelProps {
  catalog: PublisherCatalogItem[];
  className?: string;
  onAddCustom: (name: string, svg: string) => void;
  onRemove: (key: string) => void;
  onToggle: (publisher: PublisherCatalogItem) => void;
  selected: SelectedPublisher[];
}

function PositionBadge({ position }: { position: number }) {
  return (
    <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-foreground bg-foreground px-1 font-semibold text-[0.625rem] text-background tabular-nums shadow-sm">
      {position}
    </span>
  );
}

function LibraryFilters({
  category,
  onCategoryChange,
  onSearchChange,
  search,
}: {
  category: string;
  onCategoryChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  search: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <IconSearch
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          stroke={2}
        />
        <Input
          autoComplete="off"
          className="h-8 py-0 pl-9 text-xs"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search outlets..."
          type="search"
          value={search}
        />
      </div>
      <Select
        onValueChange={(value) => value && onCategoryChange(value)}
        value={category}
      >
        <SelectTrigger className="h-8 w-32 shrink-0 py-0 text-xs data-[size=default]:h-8">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {PUBLISHER_CATEGORIES.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function OutletTile({
  name,
  onToggle,
  position,
  publisherId,
}: {
  name: string;
  onToggle: () => void;
  position: number | null;
  publisherId: string;
}) {
  const selected = position !== null;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            aria-label={name}
            aria-pressed={selected}
            className={cn(
              "relative flex h-10 items-center justify-center rounded-md border px-1.5 transition-all",
              selected
                ? "border-border bg-muted/30 ring-1 ring-border/60"
                : "hover:border-border hover:bg-muted/20"
            )}
            onClick={onToggle}
            type="button"
          >
            <PublisherLogo
              className="[--logo-height:0.9375rem] [--logo-max-width:5.5rem]"
              name={name}
              publisherId={publisherId}
            />
            {selected ? <PositionBadge position={position} /> : null}
          </button>
        }
      />
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}

function UploadedTile({
  item,
  onRemove,
  position,
}: {
  item: SelectedPublisher;
  onRemove: (key: string) => void;
  position: number;
}) {
  const name = item.customName ?? "Custom outlet";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="group relative flex h-10 items-center justify-center rounded-md border border-border bg-muted/30 px-1.5 ring-1 ring-border/60">
            <PublisherLogo
              className="[--logo-height:0.9375rem] [--logo-max-width:5.5rem]"
              customLogoSvg={item.customLogoSvg}
              name={name}
            />
            <PositionBadge position={position} />
            <Button
              aria-label={`Remove ${name}`}
              className="absolute top-0.5 right-0.5 size-5 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => onRemove(item.key)}
              size="icon-sm"
              variant="secondary"
            >
              <IconX stroke={2} />
            </Button>
          </div>
        }
      />
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}

function OutletGrid({
  catalog,
  category,
  onToggle,
  search,
  selectionPositionByKey,
}: {
  catalog: PublisherCatalogItem[];
  category: string;
  onToggle: (publisher: PublisherCatalogItem) => void;
  search: string;
  selectionPositionByKey: Map<string, number>;
}) {
  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalog.filter((publisher) => {
      const matchesCategory =
        category === "All" || publisher.category === category;
      const matchesSearch =
        query.length === 0 ||
        publisher.name.toLowerCase().includes(query) ||
        publisher.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [catalog, search, category]);

  if (filteredCatalog.length === 0) {
    return (
      <Empty className="flex-1 border">
        <EmptyHeader>
          <EmptyTitle>No matches</EmptyTitle>
          <EmptyDescription>
            Try a different search or category.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border p-2">
      <div className="grid grid-cols-3 gap-1.5">
        {filteredCatalog.map((publisher) => (
          <OutletTile
            key={publisher.id}
            name={publisher.name}
            onToggle={() => onToggle(publisher)}
            position={selectionPositionByKey.get(publisher.id) ?? null}
            publisherId={publisher.id}
          />
        ))}
      </div>
    </div>
  );
}

export function OutletLibraryPanel({
  catalog,
  selected,
  onToggle,
  onAddCustom,
  onRemove,
  className,
}: OutletLibraryPanelProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tab, setTab] = useState<"bundled" | "uploads">("bundled");
  const [uploadOpen, setUploadOpen] = useState(false);

  const uploadedLogos = useMemo(
    () => selected.filter((item) => !item.publisherId),
    [selected]
  );

  const selectionPositionByKey = useMemo(() => {
    const map = new Map<string, number>();
    selected.forEach((item, index) => {
      map.set(item.publisherId ?? item.key, index + 1);
    });
    return map;
  }, [selected]);

  const selectionHint =
    selected.length === 0
      ? "Select at least one outlet."
      : "Order follows your selection sequence.";

  const handleUploadAdd = (name: string, svg: string) => {
    onAddCustom(name, svg);
    setTab("uploads");
    setUploadOpen(false);
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <p className="font-medium text-xs">
            Library
            <span className="ml-1 font-normal text-muted-foreground tabular-nums">
              · {selected.length} selected
            </span>
          </p>
          <p className="text-[0.6875rem] text-muted-foreground">
            {selectionHint}
          </p>
        </div>

        <Button
          className="h-7 shrink-0 px-2.5 text-xs"
          onClick={() => setUploadOpen(true)}
          size="sm"
          variant="secondary"
        >
          <IconPhotoUp stroke={2} />
          Upload logo
        </Button>
      </div>

      <Tabs
        className="flex min-h-0 flex-1 flex-col gap-3"
        onValueChange={(value) => setTab(value as "bundled" | "uploads")}
        value={tab}
      >
        <TabsList className="grid h-8 w-full shrink-0 grid-cols-2">
          <TabsTrigger className="text-xs" value="bundled">
            Bundled
            <span className="ml-1 text-muted-foreground tabular-nums">
              {catalog.length}
            </span>
          </TabsTrigger>
          <TabsTrigger className="text-xs" value="uploads">
            Your uploads
            <span className="ml-1 text-muted-foreground tabular-nums">
              {uploadedLogos.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          className="mt-0 flex min-h-0 flex-1 flex-col gap-3 outline-none"
          value="bundled"
        >
          <LibraryFilters
            category={category}
            onCategoryChange={setCategory}
            onSearchChange={setSearch}
            search={search}
          />
          <OutletGrid
            catalog={catalog}
            category={category}
            onToggle={onToggle}
            search={search}
            selectionPositionByKey={selectionPositionByKey}
          />
        </TabsContent>

        <TabsContent
          className="mt-0 flex min-h-0 flex-1 flex-col outline-none"
          value="uploads"
        >
          {uploadedLogos.length === 0 ? (
            <Empty className="flex-1 border">
              <EmptyHeader>
                <EmptyTitle>No uploads yet</EmptyTitle>
                <EmptyDescription>
                  Click Upload logo to add a custom outlet.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border p-2">
              <div className="grid grid-cols-3 gap-1.5">
                {uploadedLogos.map((item) => (
                  <UploadedTile
                    item={item}
                    key={item.key}
                    onRemove={onRemove}
                    position={selectionPositionByKey.get(item.key) ?? 1}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog onOpenChange={setUploadOpen} open={uploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload a logo</DialogTitle>
            <DialogDescription>
              Add a custom outlet with a PNG on a transparent background.
            </DialogDescription>
          </DialogHeader>
          <CustomOutletForm compact featured onAdd={handleUploadAdd} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
