"use client";

import { IconPhotoUp, IconX } from "@tabler/icons-react";
import { type ReactNode, useMemo, useState } from "react";
import { CustomOutletForm } from "@/components/presswall/custom-outlet-form";
import { OnboardingActions } from "@/components/presswall/onboarding-actions";
import { PublisherLibrary } from "@/components/presswall/publisher-library";
import { PublisherLogo } from "@/components/presswall/publisher-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import type { SelectedPublisher } from "@/lib/presswall-types";

interface OnboardingOutletsStepProps {
  dots: ReactNode;
  editor: PresswallEditor;
  onNext: () => void;
}

function UploadedRow({
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
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
      <div className="flex h-8 w-28 shrink-0 items-center justify-center rounded-md bg-background/60 px-1">
        <PublisherLogo
          className="[--logo-height:1.75rem]"
          customLogoSvg={item.customLogoSvg}
          name={name}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{name}</p>
        <p className="text-muted-foreground text-xs">Custom upload</p>
      </div>
      <Badge className="tabular-nums" variant="secondary">
        #{position}
      </Badge>
      <Button
        aria-label={`Remove ${name}`}
        className="shrink-0"
        onClick={() => onRemove(item.key)}
        size="icon-sm"
        variant="ghost"
      >
        <IconX stroke={2} />
      </Button>
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

  const canContinue = editor.selected.length > 0;
  const selectionHint =
    editor.selected.length === 0
      ? "Select at least one outlet to continue."
      : "Order follows your selection sequence.";

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-4">
      <p className="shrink-0 text-right text-muted-foreground text-xs">
        Step 1 of 3 — Add your press logos
      </p>

      <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[1.7fr_1fr]">
        <div className="flex min-h-0 flex-col rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-3 shrink-0">
            <p className="font-medium text-sm">
              Library
              <span className="ml-1.5 font-normal text-muted-foreground tabular-nums">
                · {editor.selected.length} selected
              </span>
            </p>
            <p className="text-muted-foreground text-xs">{selectionHint}</p>
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
              className="mt-0 flex min-h-0 flex-1 flex-col outline-none"
              value="bundled"
            >
              <PublisherLibrary
                catalog={editor.catalog}
                category={category}
                className="min-h-0 flex-1"
                listClassName="flex-1"
                onCategoryChange={setCategory}
                onSearchChange={setSearch}
                onToggle={editor.togglePublisher}
                search={search}
                selectedIds={editor.selectedIds}
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
                      Use the upload form to add a custom outlet.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto rounded-lg border p-1.5">
                  {uploadedLogos.map((item) => (
                    <UploadedRow
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
        className="shrink-0 border-t pt-4 pb-6"
        compact
        nextDisabled={!canContinue}
        nextLabel="Next"
        onNext={onNext}
      />
    </div>
  );
}
