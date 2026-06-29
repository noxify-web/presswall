"use client";

import type { ReactNode } from "react";
import { OnboardingActions } from "@/components/presswall/onboarding-actions";
import { OnboardingPreview } from "@/components/presswall/onboarding-preview";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import {
  applyPresswallTemplate,
  PRESSWALL_TEMPLATES,
  type PresswallTemplateId,
} from "@/lib/presswall-templates";
import { cn } from "@/lib/utils";

interface OnboardingTemplateStepProps {
  dots: ReactNode;
  editor: PresswallEditor;
  onBack: () => void;
  onNext: () => void;
}

function templatePreviewTheme(
  templateId: PresswallTemplateId
): "light" | "dark" {
  return templateId === "dark" ? "dark" : "light";
}

export function OnboardingTemplateStep({
  dots,
  editor,
  onBack,
  onNext,
}: OnboardingTemplateStepProps) {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-8">
      <p className="text-right text-muted-foreground text-xs">
        Step 2 of 3 — Pick a starting look
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRESSWALL_TEMPLATES.map((template) => {
          const isSelected = editor.selectedTemplateId === template.id;
          const previewConfig = {
            ...applyPresswallTemplate(template.id),
            showHeading: false,
          };

          return (
            <button
              className={cn(
                "group flex flex-col gap-3 rounded-xl border p-3 text-left transition-all",
                isSelected
                  ? "border-foreground ring-1 ring-foreground"
                  : "border-border hover:border-foreground/30"
              )}
              key={template.id}
              onClick={() => editor.applyTemplate(template.id)}
              type="button"
            >
              <OnboardingPreview
                catalog={editor.catalog}
                className="pointer-events-none border-black/5"
                config={previewConfig}
                previewTheme={templatePreviewTheme(template.id)}
                scale="sm"
                selections={editor.selections}
              />
              <div>
                <p className="font-medium text-sm">{template.name}</p>
                <p className="text-muted-foreground text-xs">
                  {template.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <OnboardingActions
        center={dots}
        className="mt-auto pt-2"
        compact
        nextLabel="Next"
        onBack={onBack}
        onNext={onNext}
        showBack
      />
    </div>
  );
}
