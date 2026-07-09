"use client";

import { useEffect, useRef, useState } from "react";
import { DeviceToggle } from "@/components/presswall/device-toggle";
import { OnboardingActions } from "@/components/presswall/onboarding-actions";
import { OnboardingPreviewCanvas } from "@/components/presswall/onboarding-preview-canvas";
import { OnboardingTemplateCustomControls } from "@/components/presswall/onboarding-template-custom-controls";
import { TemplatePicker } from "@/components/presswall/template-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import type { PresswallViewport } from "@/lib/presswall-layout-style";
import { getPresswallTemplate } from "@/lib/presswall-templates";

interface OnboardingTemplateStepProps {
  editor: PresswallEditor;
  onBack: () => void;
  onNext: () => void;
}

/**
 * When the merchant leaves a built-in template (custom design), silently
 * create a `Custom banner N` once for this custom session. Resets if they
 * re-apply a built-in so a later customize can create the next N.
 */
export function useOnboardingAutoCustomBanner(editor: PresswallEditor): void {
  const creatingRef = useRef(false);
  const createdForCustomSessionRef = useRef(false);

  useEffect(() => {
    if (editor.matchedTemplateId !== null) {
      createdForCustomSessionRef.current = false;
      return;
    }

    // Already on a merchant banner that still matches — no new create.
    if (editor.matchedCustomTemplateId !== null) {
      createdForCustomSessionRef.current = true;
      return;
    }

    if (createdForCustomSessionRef.current || creatingRef.current) {
      return;
    }

    creatingRef.current = true;
    createdForCustomSessionRef.current = true;

    editor
      .createOnboardingCustomBanner()
      .catch(() => null)
      .finally(() => {
        creatingRef.current = false;
      });
  }, [
    editor.createOnboardingCustomBanner,
    editor.matchedCustomTemplateId,
    editor.matchedTemplateId,
  ]);
}

export function OnboardingTemplateStep({
  editor,
  onBack,
  onNext,
}: OnboardingTemplateStepProps) {
  const [activeTab, setActiveTab] = useState<"templates" | "custom">(
    "templates"
  );
  const [deviceMode, setDeviceMode] = useState<PresswallViewport>("desktop");

  useOnboardingAutoCustomBanner(editor);

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3">
      <p className="shrink-0 text-muted-foreground text-xs">
        Step 2 of 3 — Design your press strip
      </p>

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
              customLogos={editor.customLogos}
              deviceMode={deviceMode}
              selections={editor.selections}
            />
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-[2] flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <Tabs
            className="flex min-h-0 flex-1 flex-col"
            onValueChange={(value) =>
              setActiveTab(value as "templates" | "custom")
            }
            value={activeTab}
          >
            <div className="shrink-0 border-b p-3">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
              value="templates"
            >
              <TemplatePicker
                catalog={editor.catalog}
                customLogos={editor.customLogos}
                customTemplates={editor.customTemplates}
                hideSavedBanners
                matchedCustomTemplateId={editor.matchedCustomTemplateId}
                matchedTemplateId={editor.matchedTemplateId}
                onApply={editor.applyTemplate}
                onApplyCustom={editor.applyCustomBanner}
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
        </div>
      </div>

      <OnboardingActions
        className="shrink-0 pt-2 pb-6"
        compact
        nextLabel="Next"
        onBack={onBack}
        onNext={onNext}
        showBack
      />
    </div>
  );
}
