"use client";

import { IconCircleCheck } from "@tabler/icons-react";
import { OnboardingPreview } from "@/components/presswall/onboarding-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import type { ShopCustomTemplate } from "@/lib/custom-template-service";
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
  customTemplates: ShopCustomTemplate[];
  matchedCustomTemplateId: string | null;
  matchedTemplateId: PresswallTemplateId | null;
  onApply: (templateId: PresswallTemplateId) => void;
  onApplyCustom: (templateId: string) => void;
  onCustomize?: () => void;
  selections: PresswallEditor["selections"];
}

function templateLayoutLabel(layout: PresswallTemplate["config"]["layout"]) {
  if (layout === "marquee") {
    return "Marquee";
  }

  return "Static grid";
}

function TemplateRow({
  catalog,
  isSelected,
  onApply,
  onCustomize,
  previewConfig,
  previewSelections,
  subtitle,
  templateName,
  layoutLabel,
}: {
  catalog: PresswallEditor["catalog"];
  isSelected: boolean;
  layoutLabel: string;
  onApply: () => void;
  onCustomize?: () => void;
  previewConfig: PresswallEditor["config"];
  previewSelections: PresswallEditor["selections"];
  subtitle: string;
  templateName: string;
}) {
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
          previewTheme={getTemplatePreviewTheme("classic")}
          scale="sm"
          selections={previewSelections}
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
            <p className="truncate font-medium text-sm">{templateName}</p>
            <Badge className="shrink-0 text-[0.625rem]" variant="secondary">
              {layoutLabel}
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
            {subtitle}
          </p>
        </button>
      </div>
    </div>
  );
}

export function TemplatePicker({
  catalog,
  customTemplates,
  matchedCustomTemplateId,
  matchedTemplateId,
  onApply,
  onApplyCustom,
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
            layoutLabel={templateLayoutLabel(template.config.layout)}
            onApply={() => onApply(template.id)}
            onCustomize={onCustomize}
            previewConfig={applyPresswallTemplate(template.id)}
            previewSelections={selections}
            subtitle={template.description}
            templateName={template.name}
          />
        ))}

        {customTemplates.length > 0 ? (
          <>
            <Separator className="my-3" />
            <p className="px-0.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Saved banners
            </p>
            {customTemplates.map((template) => (
              <TemplateRow
                catalog={catalog}
                isSelected={matchedCustomTemplateId === template.id}
                key={template.id}
                layoutLabel={templateLayoutLabel(template.config.layout)}
                onApply={() => onApplyCustom(template.id)}
                onCustomize={onCustomize}
                previewConfig={template.config}
                previewSelections={template.selections}
                subtitle={
                  template.description ??
                  "Your saved banner with styling and outlets."
                }
                templateName={template.name}
              />
            ))}
          </>
        ) : null}
      </div>
    </ScrollArea>
  );
}
