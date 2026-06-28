"use client";

import { IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { CustomOutletForm } from "@/components/presswall/custom-outlet-form";
import { OnboardingPreview } from "@/components/presswall/onboarding-preview";
import { PublisherLogo } from "@/components/presswall/publisher-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import { ONBOARDING_POPULAR_PUBLISHER_IDS } from "@/lib/onboarding-popular-publishers";
import { cn } from "@/lib/utils";

interface OnboardingOutletsStepProps {
  editor: PresswallEditor;
  onContinue: () => void;
}

export function OnboardingOutletsStep({
  editor,
  onContinue,
}: OnboardingOutletsStepProps) {
  const [search, setSearch] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const popularPublishers = useMemo(
    () =>
      ONBOARDING_POPULAR_PUBLISHER_IDS.map((id) =>
        editor.catalogById.get(id)
      ).filter((publisher) => publisher !== undefined),
    [editor.catalogById]
  );

  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    return editor.catalog.filter((publisher) => {
      if (query.length === 0) {
        return true;
      }
      return (
        publisher.name.toLowerCase().includes(query) ||
        publisher.category.toLowerCase().includes(query)
      );
    });
  }, [editor.catalog, search]);

  const canContinue = editor.selected.length > 0;

  return (
    <div className="flex w-full max-w-xl flex-col gap-8">
      <div className="space-y-2 text-center">
        <h1 className="font-semibold text-2xl tracking-tight">
          Select your outlets
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Choose the press and media logos to show on your store.
        </p>
      </div>

      <OnboardingPreview
        catalog={editor.catalog}
        config={editor.config}
        scale="md"
        selections={editor.selections}
      />

      <div className="space-y-3">
        <p className="text-center text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Popular
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {popularPublishers.map((publisher) => {
            const selected = editor.selectedIds.has(publisher.id);
            return (
              <button
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors",
                  selected
                    ? "border-foreground bg-muted ring-1 ring-foreground"
                    : "border-border bg-background hover:bg-muted/60"
                )}
                key={publisher.id}
                onClick={() => editor.togglePublisher(publisher)}
                type="button"
              >
                <PublisherLogo
                  className="[--logo-height:1rem]"
                  name={publisher.name}
                  publisherId={publisher.id}
                />
                <span className="text-xs">{publisher.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <IconSearch
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          stroke={2}
        />
        <Input
          autoComplete="off"
          className="h-10 pl-9"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search all outlets..."
          type="search"
          value={search}
        />
      </div>

      <div className="max-h-52 overflow-y-auto rounded-xl border">
        <div className="grid gap-0.5 p-1.5">
          {filteredCatalog.map((publisher) => {
            const selected = editor.selectedIds.has(publisher.id);
            return (
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                  selected ? "bg-muted" : "hover:bg-muted/50"
                )}
                key={publisher.id}
                onClick={() => editor.togglePublisher(publisher)}
                type="button"
              >
                <span
                  className={cn(
                    "size-4 shrink-0 rounded-full border",
                    selected
                      ? "border-foreground bg-foreground"
                      : "border-muted-foreground/40"
                  )}
                />
                <PublisherLogo
                  className="[--logo-height:1.5rem]"
                  name={publisher.name}
                  publisherId={publisher.id}
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {publisher.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          className="text-muted-foreground text-xs underline-offset-4 hover:text-foreground hover:underline"
          onClick={() => setShowCustom((current) => !current)}
          type="button"
        >
          {showCustom ? "Hide custom outlet" : "Add a custom outlet"}
        </button>

        {showCustom ? (
          <div className="w-full rounded-xl border p-4">
            <CustomOutletForm
              compact
              onAdd={(name, svg) => {
                editor.addCustomPublisher(name, svg);
                setShowCustom(false);
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="flex justify-center">
        <Button
          className="min-w-40"
          disabled={!canContinue}
          onClick={onContinue}
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
