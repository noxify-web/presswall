"use client";

import { IconDeviceFloppy } from "@tabler/icons-react";
import { useState } from "react";
import { DeviceToggle } from "@/components/presswall/device-toggle";
import { OnboardingPreviewCanvas } from "@/components/presswall/onboarding-preview-canvas";
import { OnboardingTemplateCustomControls } from "@/components/presswall/onboarding-template-custom-controls";
import { OutletLibraryPanel } from "@/components/presswall/outlet-library-panel";
import { TemplatePicker } from "@/components/presswall/template-picker";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import type { PresswallViewport } from "@/lib/presswall-layout-style";
import { getPresswallTemplate } from "@/lib/presswall-templates";

interface EditorWorkspaceProps {
  editor: PresswallEditor;
}

type EditorTab = "outlets" | "templates" | "custom";

export function EditorWorkspace({ editor }: EditorWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("outlets");
  const [deviceMode, setDeviceMode] = useState<PresswallViewport>("desktop");

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
              <TabsList className="grid w-full grid-cols-3">
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
                    onAddCustom={editor.addCustomPublisher}
                    onRemove={editor.removePublisher}
                    onToggle={editor.togglePublisher}
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
                matchedTemplateId={editor.matchedTemplateId}
                onApply={editor.applyTemplate}
                onCustomize={() => setActiveTab("custom")}
                selections={editor.selections}
              />
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

          <div className="shrink-0 border-t p-3">
            <Button
              className="w-full"
              disabled={editor.isLoading || editor.isSaving}
              onClick={() => {
                editor.save().catch(() => undefined);
              }}
            >
              <IconDeviceFloppy stroke={2} />
              {editor.isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
