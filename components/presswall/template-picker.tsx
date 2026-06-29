"use client";

import { IconCircleCheck } from "@tabler/icons-react";
import { OnboardingPreview } from "@/components/presswall/onboarding-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import {
  applyPresswallTemplate,
  getTemplatePreviewTheme,
  PRESSWALL_TEMPLATES,
  type PresswallTemplate,
  type PresswallTemplateId,
} from "@/lib/presswall-templates";
import { cn } from "@/lib/utils";

interface TemplatePickerProps {
  catalog: PresswallEditor["catalog"];
  matchedTemplateId: PresswallTemplateId | null;
  onApply: (templateId: PresswallTemplateId) => void;
  onCustomize?: () => void;
  selections: PresswallEditor["selections"];
}

function templateLayoutLabel(layout: PresswallTemplate["config"]["layout"]) {
  if (layout === "marquee") {
    return "Scroll";
  }
  if (layout === "grid") {
    return "Grid";
  }
  return "Bar";
}

function TemplateRow({
  catalog,
  isSelected,
  onApply,
  onCustomize,
  selections,
  template,
}: {
  catalog: PresswallEditor["catalog"];
  isSelected: boolean;
  onApply: () => void;
  onCustomize?: () => void;
  selections: PresswallEditor["selections"];
  template: PresswallTemplate;
}) {
  const previewConfig = applyPresswallTemplate(template.id);

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-lg border p-2.5 transition-all",
        isSelected
          ? "border-foreground/50 bg-muted/50 ring-1 ring-foreground/25"
          : "hover:border-foreground/20 hover:bg-muted/30"
      )}
    >
      <button
        aria-pressed={isSelected}
        className="relative w-full text-left"
        onClick={onApply}
        type="button"
      >
        <OnboardingPreview
          catalog={catalog}
          className="pointer-events-none w-full border-black/5 shadow-none"
          config={previewConfig}
          previewTheme={getTemplatePreviewTheme(template.id)}
          scale="sm"
          selections={selections}
        />

        {isSelected ? (
          <span className="absolute top-2 right-2 inline-flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm">
            <IconCircleCheck className="size-3.5" stroke={2.5} />
          </span>
        ) : null}
      </button>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <button
            aria-pressed={isSelected}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            onClick={onApply}
            type="button"
          >
            <p className="truncate font-medium text-sm">{template.name}</p>
            <Badge className="shrink-0 text-[0.625rem]" variant="secondary">
              {templateLayoutLabel(template.config.layout)}
            </Badge>
          </button>

          {isSelected && onCustomize ? (
            <Button
              className="h-7 shrink-0 px-2.5 text-xs"
              onClick={onCustomize}
              size="sm"
              type="button"
              variant="ghost"
            >
              Edit
            </Button>
          ) : null}
        </div>

        <button
          aria-pressed={isSelected}
          className="w-full text-left"
          onClick={onApply}
          type="button"
        >
          <p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
            {template.description}
          </p>
        </button>
      </div>
    </div>
  );
}

export function TemplatePicker({
  catalog,
  matchedTemplateId,
  onApply,
  onCustomize,
  selections,
}: TemplatePickerProps) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-2 p-3">
        {PRESSWALL_TEMPLATES.map((template) => (
          <TemplateRow
            catalog={catalog}
            isSelected={matchedTemplateId === template.id}
            key={template.id}
            onApply={() => onApply(template.id)}
            onCustomize={onCustomize}
            selections={selections}
            template={template}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
