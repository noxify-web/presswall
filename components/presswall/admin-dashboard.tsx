"use client";

import { IconDeviceFloppy } from "@tabler/icons-react";
import { CustomOutletForm } from "@/components/presswall/custom-outlet-form";
import { PresswallPreview } from "@/components/presswall/preview";
import { PublisherLibrary } from "@/components/presswall/publisher-library";
import { SelectedOutlets } from "@/components/presswall/selected-outlets";
import { StyleControls } from "@/components/presswall/style-controls";
import { ThemeActivationBanner } from "@/components/presswall/theme-activation-banner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePresswallEditor } from "@/hooks/use-presswall-editor";

export function AdminDashboard() {
  const editor = usePresswallEditor();

  return (
    <div className="flex min-h-svh flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
        <ThemeActivationBanner />

        {editor.unavailableCount > 0 ? (
          <Alert variant="destructive">
            <AlertTitle>Some outlets are no longer available</AlertTitle>
            <AlertDescription>
              {editor.unavailableCount} previously selected outlet
              {editor.unavailableCount === 1 ? "" : "s"} no longer appear in the
              library and will not show on your storefront. Remove them or save
              to update your presswall.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="order-2 flex flex-col gap-8 lg:order-1">
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold text-lg">Outlets</h2>
                <p className="text-muted-foreground text-sm">
                  Select from {editor.catalog.length} built-in outlets or add
                  your own.
                </p>
              </div>
              <PublisherLibrary
                catalog={editor.catalog}
                category={editor.category}
                listClassName="h-56"
                onCategoryChange={editor.setCategory}
                onSearchChange={editor.setSearch}
                onToggle={editor.togglePublisher}
                search={editor.search}
                selectedIds={editor.selectedIds}
              />
              <SelectedOutlets
                catalogById={editor.catalogById}
                onMove={editor.movePublisher}
                onRemove={editor.removePublisher}
                selected={editor.selected}
              />
              <CustomOutletForm onAdd={editor.addCustomPublisher} />
            </section>

            <StyleControls
              config={editor.config}
              onUpdate={editor.updateConfig}
            />
          </div>

          <div className="order-1 lg:sticky lg:top-6 lg:order-2 lg:h-fit">
            <PresswallPreview
              catalog={editor.catalog}
              config={editor.config}
              selections={editor.selections}
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 p-4">
          <p className="text-muted-foreground text-sm">
            {editor.selected.length} outlet
            {editor.selected.length === 1 ? "" : "s"} selected
          </p>
          <Button
            disabled={editor.isLoading || editor.isSaving}
            onClick={() => {
              editor.save().catch(() => undefined);
            }}
            size="lg"
          >
            <IconDeviceFloppy stroke={2} />
            {editor.isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
