"use client";

import { useState } from "react";
import { DeviceToggle } from "@/components/presswall/device-toggle";
import { EditorFloatingSaveBar } from "@/components/presswall/editor-floating-save-bar";
import { OnboardingPreviewCanvas } from "@/components/presswall/onboarding-preview-canvas";
import { OnboardingTemplateCustomControls } from "@/components/presswall/onboarding-template-custom-controls";
import { OutletLibraryPanel } from "@/components/presswall/outlet-library-panel";
import { ReplaceLogoDialog } from "@/components/presswall/replace-logo-dialog";
import { TemplatePicker } from "@/components/presswall/template-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import type { PresswallViewport } from "@/lib/presswall-layout-style";
import { getPresswallTemplate } from "@/lib/presswall-templates";

interface EditorWorkspaceProps {
  editor: PresswallEditor;
  /** When true (App Window), drop max-width so the canvas uses full screen. */
  fullBleed?: boolean;
}

type EditorTab = "custom" | "outlets" | "templates";

export function EditorWorkspace({
  editor,
  fullBleed = false,
}: EditorWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("custom");
  const [deviceMode, setDeviceMode] = useState<PresswallViewport>("desktop");
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  const replaceCurrentLabel = (() => {
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
  })();

  return (
    <div
      className={
        fullBleed
          ? "flex h-full w-full flex-col gap-3"
          : "mx-auto flex h-full w-full max-w-7xl flex-col gap-3"
      }
    >
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Live preview — primary canvas; Save/Discard float centered here */}
        <div className="relative flex min-h-0 min-w-0 flex-[3] flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <p className="font-medium text-sm">Live preview</p>
              {editor.isDirty ? (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-[0.625rem] text-amber-800">
                  Unsaved
                </span>
              ) : null}
            </div>

            <DeviceToggle mode={deviceMode} onChange={setDeviceMode} />
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

          <EditorFloatingSaveBar
            isDirty={editor.isDirty}
            isSaving={editor.isSaving}
            onDiscard={editor.discard}
            onSave={editor.save}
          />
        </div>

        {/* Side panel — style / outlets / templates */}
        <div className="flex min-h-0 min-w-0 flex-[2] flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <Tabs
            className="flex min-h-0 flex-1 flex-col"
            onValueChange={(value) => setActiveTab(value as EditorTab)}
            value={activeTab}
          >
            <div className="shrink-0 border-b p-3">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="custom">Style</TabsTrigger>
                <TabsTrigger value="outlets">
                  Outlets
                  {editor.selected.length > 0 ? (
                    <span className="ml-1 text-muted-foreground tabular-nums">
                      ({editor.selected.length})
                    </span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>
            </div>

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
              <TemplatePicker
                catalog={editor.catalog}
                customLogos={editor.customLogos}
                matchedTemplateId={editor.matchedTemplateId}
                onApply={editor.applyTemplate}
                selections={editor.selections}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

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
