"use client";

import { IconPhotoUp, IconSearch } from "@tabler/icons-react";
import { type ReactNode, useMemo, useState } from "react";
import { CustomOutletForm } from "@/components/presswall/custom-outlet-form";
import { OnboardingActions } from "@/components/presswall/onboarding-actions";
import { PublisherLogo } from "@/components/presswall/publisher-logo";
import { Badge } from "@/components/ui/badge";
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
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import type { SelectedPublisher } from "@/lib/presswall-types";
import { PUBLISHER_CATEGORIES } from "@/lib/publishers-seed";
import { cn } from "@/lib/utils";

interface OnboardingOutletsStepProps {
  dots: ReactNode;
  editor: PresswallEditor;
  onNext: () => void;
}

function PositionBadge({ position }: { position: number }) {
  return (
    <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-foreground bg-foreground px-1 font-semibold text-[0.625rem] text-background tabular-nums shadow-sm">
      {position}
    </span>
  );
}

function BundledTile({
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
    <button
      aria-label={name}
      aria-pressed={selected}
      className={cn(
        "relative flex h-12 items-center justify-center rounded-lg border bg-card px-2 transition-all",
        selected
          ? "border-foreground/40 bg-muted/60"
          : "hover:border-foreground/20 hover:bg-muted/40"
      )}
      onClick={onToggle}
      title={name}
      type="button"
    >
      <PublisherLogo
        className="[--logo-height:1.35rem]"
        name={name}
        publisherId={publisherId}
      />
      {selected ? <PositionBadge position={position} /> : null}
    </button>
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
    <button
      aria-label={`Remove ${name}`}
      className="group relative flex h-12 items-center justify-center rounded-lg border bg-muted/60 px-2"
      onClick={() => onRemove(item.key)}
      title={`Remove ${name}`}
      type="button"
    >
      <PublisherLogo
        className="[--logo-height:1.35rem]"
        customLogoSvg={item.customLogoSvg}
        name={name}
      />
      <PositionBadge position={position} />
    </button>
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
    <div className="flex gap-2">
      <div className="relative flex-1">
        <IconSearch
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          stroke={2}
        />
        <Input
          autoComplete="off"
          className="h-9 pl-9"
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
        <SelectTrigger className="h-9 w-36">
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

export function OnboardingOutletsStep({
  dots,
  editor,
  onNext,
}: OnboardingOutletsStepProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tab, setTab] = useState<"bundled" | "uploads">("bundled");

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

  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    return editor.catalog.filter((publisher) => {
      const matchesCategory =
        category === "All" || publisher.category === category;
      const matchesSearch =
        query.length === 0 ||
        publisher.name.toLowerCase().includes(query) ||
        publisher.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [editor.catalog, search, category]);

  const canContinue = editor.selected.length > 0;

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-4">
      <p className="shrink-0 text-right text-muted-foreground text-xs">
        Step 1 of 3 — Add your press logos
      </p>

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto md:grid-cols-[1.7fr_1fr]">
        <div className="flex min-h-0 flex-col rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="font-medium text-sm">Library</p>
            <div className="flex flex-col items-end gap-0.5">
              <Badge className="tabular-nums" variant="secondary">
                {editor.selected.length} selected
              </Badge>
              {editor.selected.length > 0 ? (
                <p className="text-[0.65rem] text-muted-foreground">
                  Order follows selection sequence
                </p>
              ) : null}
            </div>
          </div>

          <Tabs
            onValueChange={(value) => setTab(value as "bundled" | "uploads")}
            value={tab}
          >
            <TabsList className="mb-3 grid h-9 w-full grid-cols-2">
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

            <TabsContent className="mt-0 outline-none" value="bundled">
              <div className="flex flex-col gap-3">
                <LibraryFilters
                  category={category}
                  onCategoryChange={setCategory}
                  onSearchChange={setSearch}
                  search={search}
                />

                {filteredCatalog.length === 0 ? (
                  <Empty className="border py-10">
                    <EmptyHeader>
                      <EmptyTitle>No matches</EmptyTitle>
                      <EmptyDescription>
                        Try a different search or category.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="max-h-64 overflow-y-auto rounded-lg border bg-background/40 p-2">
                    <div className="grid grid-cols-3 gap-2">
                      {filteredCatalog.map((publisher) => (
                        <BundledTile
                          key={publisher.id}
                          name={publisher.name}
                          onToggle={() => editor.togglePublisher(publisher)}
                          position={
                            selectionPositionByKey.get(publisher.id) ?? null
                          }
                          publisherId={publisher.id}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent className="mt-0 outline-none" value="uploads">
              {uploadedLogos.length === 0 ? (
                <Empty className="border py-10">
                  <EmptyHeader>
                    <EmptyTitle>No uploads yet</EmptyTitle>
                    <EmptyDescription>
                      Use the upload form to add a custom outlet.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="grid grid-cols-3 gap-2 rounded-lg border bg-background/40 p-2">
                  {uploadedLogos.map((item) => (
                    <UploadedTile
                      item={item}
                      key={item.key}
                      onRemove={editor.removePublisher}
                      position={selectionPositionByKey.get(item.key) ?? 1}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex min-h-0 flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-muted">
              <IconPhotoUp
                className="size-4 text-muted-foreground"
                stroke={2}
              />
            </span>
            <div>
              <p className="font-medium text-sm">Upload a logo</p>
              <p className="text-muted-foreground text-xs">
                PNG with a transparent background
              </p>
            </div>
          </div>

          <CustomOutletForm
            compact
            featured
            onAdd={(name, svg) => {
              editor.addCustomPublisher(name, svg);
              setTab("uploads");
            }}
          />
        </div>
      </div>

      <OnboardingActions
        center={dots}
        className="shrink-0 border-t pt-4"
        compact
        nextDisabled={!canContinue}
        nextLabel="Next"
        onNext={onNext}
      />
    </div>
  );
}
