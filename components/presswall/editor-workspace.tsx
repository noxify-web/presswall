"use client";

import { IconBookmark, IconDeviceFloppy } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { BannerAssignmentsPanel } from "@/components/presswall/banner-assignments-panel";
import { DeviceToggle } from "@/components/presswall/device-toggle";
import { OnboardingPreviewCanvas } from "@/components/presswall/onboarding-preview-canvas";
import { OnboardingTemplateCustomControls } from "@/components/presswall/onboarding-template-custom-controls";
import { OutletLibraryPanel } from "@/components/presswall/outlet-library-panel";
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
}

type EditorTab = "outlets" | "templates" | "custom" | "placement";

export function EditorWorkspace({ editor }: EditorWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("outlets");
  const [deviceMode, setDeviceMode] = useState<PresswallViewport>("desktop");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [lastSavedConfig, setLastSavedConfig] =
    useState<PresswallConfig | null>(null);

  const canSaveTemplate = useMemo(
    () =>
      lastSavedConfig === null ||
      !presswallConfigsEqual(editor.config, lastSavedConfig) ||
      editor.isDirty,
    [editor.config, editor.isDirty, lastSavedConfig]
  );

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3">
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex min-h-0 min-w-0 flex-[3] flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b px-4 py-2.5">
            <p className="font-medium text-sm">Live preview</p>
            <DeviceToggle mode={deviceMode} onChange={setDeviceMode} />
          </div>

          <div className="min-h-0 flex-1">
            <OnboardingPreviewCanvas
              catalog={editor.catalog}
              config={editor.config}
              deviceMode={deviceMode}
              selections={editor.selections}
            />
          </div>
        </div>

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
                <TabsTrigger value="custom">Custom</TabsTrigger>
                <TabsTrigger value="placement">Placement</TabsTrigger>
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
                  customTemplates={editor.customTemplates}
                  matchedCustomTemplateId={editor.matchedCustomTemplateId}
                  matchedTemplateId={editor.matchedTemplateId}
                  onApply={editor.applyTemplate}
                  onApplyCustom={editor.applyCustomBanner}
                  onCustomize={() => setActiveTab("custom")}
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

          <div className="flex shrink-0 gap-2 border-t p-3">
            <Button
              className="flex-1"
              disabled={!editor.isDirty || editor.isLoading || editor.isSaving}
              onClick={editor.discard}
              type="button"
              variant="outline"
            >
              Discard
            </Button>
            <Button
              className="flex-1"
              disabled={!editor.isDirty || editor.isLoading || editor.isSaving}
              onClick={() => {
                editor.save().catch(() => undefined);
              }}
              type="button"
            >
              <IconDeviceFloppy stroke={2} />
              {editor.isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
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
      />
    </div>
  );
}
