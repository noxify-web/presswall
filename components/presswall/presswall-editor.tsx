"use client";

import { IconDeviceFloppy, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { CustomOutletForm } from "@/components/presswall/custom-outlet-form";
import { PresswallPreview } from "@/components/presswall/preview";
import { PublisherLibrary } from "@/components/presswall/publisher-library";
import { SelectedOutlets } from "@/components/presswall/selected-outlets";
import { StyleControls } from "@/components/presswall/style-controls";
import { ThemeActivationBanner } from "@/components/presswall/theme-activation-banner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import { cn } from "@/lib/utils";

interface PresswallEditorPanelProps {
  editor: PresswallEditor;
}

export function PresswallEditorPanel({ editor }: PresswallEditorPanelProps) {
  const [activeTab, setActiveTab] = useState("outlets");
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-semibold text-base tracking-tight">
                As seen on
              </h1>
              {editor.isDirty ? (
                <Badge className="shrink-0" variant="outline">
                  Unsaved
                </Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Pick outlets, tune the look, then add it to your Shopify theme.
            </p>
          </div>

          <Button
            disabled={editor.isLoading || editor.isSaving || !editor.isDirty}
            onClick={() => {
              editor.save().catch(() => undefined);
            }}
            size="sm"
          >
            <IconDeviceFloppy stroke={2} />
            {editor.isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <ThemeActivationBanner isDirty={editor.isDirty} />

        {editor.unavailableCount > 0 ? (
          <Alert variant="destructive">
            <AlertTitle>Some outlets are no longer available</AlertTitle>
            <AlertDescription>
              {editor.unavailableCount} previously selected outlet
              {editor.unavailableCount === 1 ? "" : "s"} will not show on your
              storefront. Remove them or save to update.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid flex-1 gap-5 lg:grid-cols-5 lg:gap-6">
          <section className="flex min-h-0 flex-col lg:col-span-3">
            <Tabs onValueChange={setActiveTab} value={activeTab}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <TabsList>
                  <TabsTrigger value="outlets">
                    Outlets
                    <Badge className="ml-1.5 tabular-nums" variant="secondary">
                      {editor.selected.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="style">Style</TabsTrigger>
                </TabsList>

                {activeTab === "outlets" ? (
                  <Dialog
                    onOpenChange={setCustomDialogOpen}
                    open={customDialogOpen}
                  >
                    <DialogTrigger
                      render={
                        <Button size="sm" variant="outline">
                          <IconPlus stroke={2} />
                          Custom
                        </Button>
                      }
                    />
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add custom outlet</DialogTitle>
                        <DialogDescription>
                          For podcasts, local press, or blogs not in the
                          library.
                        </DialogDescription>
                      </DialogHeader>
                      <CustomOutletForm
                        onAdd={(name, svg) => {
                          editor.addCustomPublisher(name, svg);
                          setCustomDialogOpen(false);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                ) : null}
              </div>

              <TabsContent
                className="mt-0 flex min-h-0 flex-1 flex-col"
                value="outlets"
              >
                <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-2">
                  <div className="flex min-h-0 flex-col gap-2">
                    <div>
                      <h2 className="font-medium text-sm">Library</h2>
                      <p className="text-muted-foreground text-xs">
                        {editor.catalog.length} outlets — click to add or
                        remove.
                      </p>
                    </div>
                    <PublisherLibrary
                      catalog={editor.catalog}
                      category={editor.category}
                      listClassName="h-[min(42vh,360px)]"
                      onCategoryChange={editor.setCategory}
                      onSearchChange={editor.setSearch}
                      onToggle={editor.togglePublisher}
                      search={editor.search}
                      selectedIds={editor.selectedIds}
                      variant="grid"
                    />
                  </div>

                  <div className="flex min-h-0 flex-col gap-2">
                    <div>
                      <h2 className="font-medium text-sm">Your lineup</h2>
                      <p className="text-muted-foreground text-xs">
                        Order is left-to-right on your storefront.
                      </p>
                    </div>
                    <SelectedOutlets
                      catalogById={editor.catalogById}
                      className="h-[min(42vh,360px)]"
                      onMove={editor.movePublisher}
                      onRemove={editor.removePublisher}
                      selected={editor.selected}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent className="mt-0" value="style">
                <StyleControls
                  config={editor.config}
                  onUpdate={editor.updateConfig}
                />
              </TabsContent>
            </Tabs>
          </section>

          <aside
            className={cn(
              "order-first lg:order-last lg:col-span-2",
              "lg:sticky lg:top-4 lg:self-start"
            )}
          >
            <PresswallPreview
              catalog={editor.catalog}
              compact
              config={editor.config}
              isLoading={editor.isLoading}
              selections={editor.selections}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
