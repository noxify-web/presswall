"use client";

import {
  IconDeviceFloppy,
  IconNewSection,
  IconPalette,
  IconPlus,
} from "@tabler/icons-react";
import { CustomOutletForm } from "@/components/presswall/custom-outlet-form";
import { PresswallPreview } from "@/components/presswall/preview";
import { PublisherLibrary } from "@/components/presswall/publisher-library";
import { SelectedOutlets } from "@/components/presswall/selected-outlets";
import { StyleControls } from "@/components/presswall/style-controls";
import { ThemeActivationBanner } from "@/components/presswall/theme-activation-banner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePresswallEditor } from "@/hooks/use-presswall-editor";

export function AdminDashboard() {
  const editor = usePresswallEditor();

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      {/* ── Top bar ── */}
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-sm">Presswall</h1>
          <Badge className="tabular-nums" variant="outline">
            {editor.selected.length} outlet
            {editor.selected.length === 1 ? "" : "s"}
          </Badge>
        </div>
        <Button
          disabled={editor.isLoading || editor.isSaving}
          onClick={() => {
            editor.save().catch(() => undefined);
          }}
          size="sm"
        >
          <IconDeviceFloppy className="size-4" stroke={2} />
          {editor.isSaving ? "Saving…" : "Save"}
        </Button>
      </header>

      {/* ── Banners ── */}
      <div className="shrink-0 space-y-0">
        <ThemeActivationBanner className="rounded-none border-x-0 border-t-0" />

        {editor.unavailableCount > 0 ? (
          <Alert className="rounded-none border-x-0" variant="destructive">
            <AlertTitle>Some outlets are no longer available</AlertTitle>
            <AlertDescription>
              {editor.unavailableCount} previously selected outlet
              {editor.unavailableCount === 1 ? "" : "s"} no longer appear in the
              library and will not show on your storefront.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      {/* ── Split pane: controls | preview ── */}
      <div className="flex min-h-0 flex-1">
        {/* Left pane — controls */}
        <div className="flex w-full flex-col border-r md:w-[400px] md:min-w-[360px] md:max-w-[440px]">
          <Tabs className="flex min-h-0 flex-1 flex-col" defaultValue="outlets">
            <TabsList className="mx-3 mt-3 grid w-auto grid-cols-3">
              <TabsTrigger value="outlets">
                <IconNewSection className="size-3.5" stroke={2} />
                Outlets
              </TabsTrigger>
              <TabsTrigger value="style">
                <IconPalette className="size-3.5" stroke={2} />
                Style
              </TabsTrigger>
              <TabsTrigger value="custom">
                <IconPlus className="size-3.5" stroke={2} />
                Custom
              </TabsTrigger>
            </TabsList>

            <TabsContent
              className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-3"
              value="outlets"
            >
              <PublisherLibrary
                catalog={editor.catalog}
                category={editor.category}
                onCategoryChange={editor.setCategory}
                onSearchChange={editor.setSearch}
                onToggle={editor.togglePublisher}
                search={editor.search}
                selectedIds={editor.selectedIds}
              />

              {editor.selected.length > 0 ? (
                <>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                      Order
                    </h3>
                    <SelectedOutlets
                      catalogById={editor.catalogById}
                      onMove={editor.movePublisher}
                      onRemove={editor.removePublisher}
                      selected={editor.selected}
                    />
                  </div>
                </>
              ) : null}
            </TabsContent>

            <TabsContent
              className="min-h-0 flex-1 overflow-y-auto px-3 pb-3"
              value="style"
            >
              <StyleControls
                config={editor.config}
                onUpdate={editor.updateConfig}
              />
            </TabsContent>

            <TabsContent
              className="min-h-0 flex-1 overflow-y-auto px-3 pb-3"
              value="custom"
            >
              <div className="flex flex-col gap-2">
                <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Add custom outlet
                </h3>
                <p className="text-muted-foreground text-xs">
                  Add a podcast, local news site, or blog not in the library.
                </p>
                <CustomOutletForm onAdd={editor.addCustomPublisher} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right pane — live preview */}
        <div className="hidden min-h-0 flex-1 flex-col bg-muted/10 p-4 md:flex">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Live Preview
            </p>
          </div>
          <PresswallPreview
            catalog={editor.catalog}
            config={editor.config}
            selections={editor.selections}
          />
        </div>
      </div>
    </div>
  );
}
