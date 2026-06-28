"use client";

import { OnboardingPreview } from "@/components/presswall/onboarding-preview";
import { Button } from "@/components/ui/button";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import {
  applyPresswallTemplate,
  PRESSWALL_TEMPLATES,
  type PresswallTemplateId,
} from "@/lib/presswall-templates";
import { cn } from "@/lib/utils";

interface OnboardingTemplateStepProps {
  editor: PresswallEditor;
  onContinue: () => void;
}

function templatePreviewTheme(
  templateId: PresswallTemplateId
): "light" | "dark" {
  return templateId === "dark" ? "dark" : "light";
}

export function OnboardingTemplateStep({
  editor,
  onContinue,
}: OnboardingTemplateStepProps) {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-8">
      <div className="space-y-2 text-center">
        <h1 className="font-semibold text-2xl tracking-tight">
          Pick a starting look
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Choose a template — you can fine-tune everything later.
        </p>
      </div>

      <OnboardingPreview
        catalog={editor.catalog}
        config={editor.config}
        previewTheme={templatePreviewTheme(editor.selectedTemplateId)}
        scale="lg"
        selections={editor.selections}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRESSWALL_TEMPLATES.map((template) => {
          const isSelected = editor.selectedTemplateId === template.id;
          const previewConfig = applyPresswallTemplate(template.id);

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

      <div className="flex justify-center">
        <Button className="min-w-40" onClick={onContinue} size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
}
