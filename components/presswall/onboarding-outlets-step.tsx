"use client";

import { IconPhotoUp, IconSearch, IconX } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { CustomOutletForm } from "@/components/presswall/custom-outlet-form";
import { OnboardingActions } from "@/components/presswall/onboarding-actions";
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
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import type {
  PublisherCatalogItem,
  SelectedPublisher,
} from "@/lib/presswall-types";
import { PUBLISHER_CATEGORIES } from "@/lib/publishers-seed";
import { cn } from "@/lib/utils";

interface OnboardingOutletsStepProps {
  editor: PresswallEditor;
  onNext: () => void;
  onSkip: () => void;
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
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          stroke={2}
        />
        <Input
          autoComplete="off"
          className="h-9 py-0 pl-9"
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
        <SelectTrigger className="h-9 w-36 shrink-0 py-0 data-[size=default]:h-9">
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
              "relative flex h-12 items-center justify-center rounded-lg border px-2 transition-all",
              selected
                ? "border-foreground/50 bg-muted/60 ring-1 ring-foreground/30"
                : "hover:border-foreground/20 hover:bg-muted/40"
            )}
            onClick={onToggle}
            type="button"
          >
            <PublisherLogo
              className="[--logo-height:1.5rem]"
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
          <div className="group relative flex h-12 items-center justify-center rounded-lg border border-foreground/50 bg-muted/60 px-2 ring-1 ring-foreground/30">
            <PublisherLogo
              className="[--logo-height:1.5rem]"
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
      <div className="grid grid-cols-4 gap-2">
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

export function OnboardingOutletsStep({
  editor,
  onNext,
  onSkip,
}: OnboardingOutletsStepProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tab, setTab] = useState<"bundled" | "uploads">("bundled");
  const [uploadOpen, setUploadOpen] = useState(false);

  const uploadedLogos = useMemo(
    () => editor.selected.filter((item) => !item.publisherId),
    [editor.selected]
  );

  const selectionPositionByKey = useMemo(() => {
    const map = new Map<string, number>();
    editor.selected.forEach((item, index) => {
      map.set(item.publisherId ?? item.key, index + 1);
    });
    return map;
  }, [editor.selected]);

  const canContinue = editor.selected.length > 0;
  const selectionHint =
    editor.selected.length === 0
      ? "Select at least one outlet to continue."
      : "Order follows your selection sequence.";

  const handleUploadAdd = (name: string, svg: string) => {
    editor.addCustomPublisher(name, svg);
    setTab("uploads");
    setUploadOpen(false);
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-4">
      <p className="shrink-0 text-right text-muted-foreground text-xs">
        Step 1 of 3 — Add your press logos
      </p>

      <div className="flex min-h-0 flex-1 flex-col rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
          <div>
            <p className="font-medium text-sm">
              Library
              <span className="ml-1.5 font-normal text-muted-foreground tabular-nums">
                · {editor.selected.length} selected
              </span>
            </p>
            <p className="text-muted-foreground text-xs">{selectionHint}</p>
          </div>

          <Button
            className="shrink-0"
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
          <TabsList className="grid h-9 w-full shrink-0 grid-cols-2">
            <TabsTrigger value="bundled">
              Bundled
              <span className="ml-1 text-muted-foreground tabular-nums">
                {editor.catalog.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="uploads">
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
              catalog={editor.catalog}
              category={category}
              onToggle={editor.togglePublisher}
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
                <div className="grid grid-cols-4 gap-2">
                  {uploadedLogos.map((item) => (
                    <UploadedTile
                      item={item}
                      key={item.key}
                      onRemove={editor.removePublisher}
                      position={selectionPositionByKey.get(item.key) ?? 1}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

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

      <OnboardingActions
        className="shrink-0 pt-4 pb-6"
        compact
        nextDisabled={!canContinue}
        nextLabel="Next"
        onNext={onNext}
        onSkip={onSkip}
        skipLoading={editor.isSaving}
      />
    </div>
  );
}
