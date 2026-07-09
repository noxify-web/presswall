"use client";

import {
  IconBookmark,
  IconDeviceFloppy,
  IconLoader2,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { BannerAssignmentsPanel } from "@/components/presswall/banner-assignments-panel";
import { DeviceToggle } from "@/components/presswall/device-toggle";
import { OnboardingPreviewCanvas } from "@/components/presswall/onboarding-preview-canvas";
import { OnboardingTemplateCustomControls } from "@/components/presswall/onboarding-template-custom-controls";
import { OutletLibraryPanel } from "@/components/presswall/outlet-library-panel";
import { ReplaceLogoDialog } from "@/components/presswall/replace-logo-dialog";
import { SaveTemplateDialog } from "@/components/presswall/save-template-dialog";
import { TemplatePicker } from "@/components/presswall/template-picker";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import type { PresswallViewport } from "@/lib/presswall-layout-style";
import {
  getPresswallTemplate,
  presswallConfigsEqual,
} from "@/lib/presswall-templates";
import type { PresswallConfig } from "@/lib/presswall-types";

interface EditorWorkspaceProps {
  editor: PresswallEditor;
  /** When true (App Window), drop max-width so the canvas uses full screen. */
  fullBleed?: boolean;
}

type EditorTab = "outlets" | "templates" | "custom" | "placement";

export function EditorWorkspace({
  editor,
  fullBleed = false,
}: EditorWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("outlets");
  const [deviceMode, setDeviceMode] = useState<PresswallViewport>("desktop");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [lastSavedConfig, setLastSavedConfig] =
    useState<PresswallConfig | null>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  const canSaveTemplate = useMemo(
    () =>
      lastSavedConfig === null ||
      !presswallConfigsEqual(editor.config, lastSavedConfig) ||
      editor.isDirty,
    [editor.config, editor.isDirty, lastSavedConfig]
  );

  const saveDisabled = !editor.isDirty || editor.isLoading || editor.isSaving;

  const replaceCurrentLabel = useMemo(() => {
    if (replaceIndex === null) {
      return "this outlet";
    }
    const item = editor.selected[replaceIndex];
    if (!item) {
      return "this outlet";
    }
    if (item.publisherId) {
      return editor.catalogById.get(item.publisherId)?.name ?? item.publisherId;
    }
    return item.customName ?? "custom logo";
  }, [editor.catalogById, editor.selected, replaceIndex]);

  return (
    <div
      className={
        fullBleed
          ? "flex h-full w-full flex-col gap-3"
          : "mx-auto flex h-full w-full max-w-7xl flex-col gap-3"
      }
    >
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Live preview — primary canvas + save / logo style */}
        <div className="flex min-h-0 min-w-0 flex-[3] flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <p className="font-medium text-sm">Live preview</p>
              {editor.isDirty ? (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-[0.625rem] text-amber-800">
                  Unsaved
                </span>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <DeviceToggle mode={deviceMode} onChange={setDeviceMode} />
              <Button
                disabled={saveDisabled}
                onClick={editor.discard}
                size="sm"
                type="button"
                variant="ghost"
              >
                Discard
              </Button>
              <Button
                disabled={saveDisabled}
                onClick={() => {
                  editor.save().catch(() => undefined);
                }}
                size="sm"
                type="button"
              >
                {editor.isSaving ? (
                  <IconLoader2 className="size-4 animate-spin" stroke={2} />
                ) : (
                  <IconDeviceFloppy stroke={2} />
                )}
                {editor.isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <OnboardingPreviewCanvas
              catalog={editor.catalog}
              config={editor.config}
              customLogos={editor.customLogos}
              deviceMode={deviceMode}
              onColorModeChange={(value) =>
                editor.updateConfig("colorMode", value)
              }
              onReplaceLogoAt={setReplaceIndex}
              selections={editor.selections}
            />
          </div>
        </div>

        {/* Side panel — outlets / templates / style / placement */}
        <div className="flex min-h-0 min-w-0 flex-[2] flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <Tabs
            className="flex min-h-0 flex-1 flex-col"
            onValueChange={(value) => setActiveTab(value as EditorTab)}
            value={activeTab}
          >
            <div className="shrink-0 border-b p-3">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="outlets">
                  Outlets
                  {editor.selected.length > 0 ? (
                    <span className="ml-1 text-muted-foreground tabular-nums">
                      ({editor.selected.length})
                    </span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="custom">Style</TabsTrigger>
                <TabsTrigger value="placement">By page</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
              value="outlets"
            >
              <ScrollArea className="min-h-0 flex-1">
                <div className="p-3">
                  <OutletLibraryPanel
                    catalog={editor.catalog}
                    colorMode={editor.config.colorMode}
                    customLogos={editor.customLogos}
                    onDeleteCustom={editor.deleteCustomLogo}
                    onToggle={editor.togglePublisher}
                    onToggleCustom={editor.toggleCustomLogo}
                    onUploadCustom={editor.uploadCustomLogo}
                    selected={editor.selected}
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent
              className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
              value="templates"
            >
              <div className="flex min-h-0 flex-1 flex-col">
                {canSaveTemplate ? (
                  <div className="shrink-0 border-b p-3">
                    <Button
                      className="w-full"
                      onClick={() => setSaveDialogOpen(true)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      <IconBookmark stroke={2} />
                      Save as template
                    </Button>
                  </div>
                ) : null}
                <TemplatePicker
                  catalog={editor.catalog}
                  customLogos={editor.customLogos}
                  customTemplates={editor.customTemplates}
                  matchedCustomTemplateId={editor.matchedCustomTemplateId}
                  matchedTemplateId={editor.matchedTemplateId}
                  onApply={editor.applyTemplate}
                  onApplyCustom={editor.applyCustomBanner}
                  onCustomize={() => setActiveTab("custom")}
                  onGoToPlacement={() => setActiveTab("placement")}
                  selections={editor.selections}
                />
              </div>
            </TabsContent>

            <TabsContent
              className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
              value="placement"
            >
              <BannerAssignmentsPanel />
            </TabsContent>

            <TabsContent
              className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
              value="custom"
            >
              <OnboardingTemplateCustomControls
                config={editor.config}
                matchedTemplateName={
                  editor.matchedTemplateId
                    ? getPresswallTemplate(editor.matchedTemplateId).name
                    : undefined
                }
                onUpdate={editor.updateConfig}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <SaveTemplateDialog
        config={editor.config}
        onOpenChange={setSaveDialogOpen}
        onSaved={() => {
          setLastSavedConfig(editor.config);
          editor.refreshCustomTemplates().catch(() => undefined);
        }}
        open={saveDialogOpen}
        selections={editor.selections}
        showPlacementHint
      />

      <ReplaceLogoDialog
        catalog={editor.catalog}
        colorMode={editor.config.colorMode}
        currentLabel={replaceCurrentLabel}
        customLogos={editor.customLogos}
        onOpenChange={(open) => {
          if (!open) {
            setReplaceIndex(null);
          }
        }}
        onSelectCustom={(logo) => {
          if (replaceIndex !== null) {
            editor.replaceCustomLogoAt(replaceIndex, logo);
          }
        }}
        onSelectPublisher={(publisher) => {
          if (replaceIndex !== null) {
            editor.replacePublisherAt(replaceIndex, publisher);
          }
        }}
        onUploadCustom={editor.createCustomLogo}
        open={replaceIndex !== null}
      />
    </div>
  );
}
