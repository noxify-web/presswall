"use client";

import { IconCircleCheck } from "@tabler/icons-react";
import type { ReactNode } from "react";
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
  customLogos: PresswallEditor["customLogos"];
  matchedTemplateId: PresswallTemplateId | null;
  onApply: (templateId: PresswallTemplateId) => void;
  onCustomize?: () => void;
  selections: PresswallEditor["selections"];
}

function TemplateSectionHeader({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        {action}
      </div>
      {description ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function templateLayoutLabel(layout: PresswallTemplate["config"]["layout"]) {
  if (layout === "marquee") {
    return "Marquee";
  }
  return "Bar";
}

function TemplateRow({
  catalog,
  customLogos,
  isSelected,
  layoutLabel,
  onApply,
  onCustomize,
  previewConfig,
  previewSelections,
  previewTheme,
  subtitle,
  templateName,
}: {
  catalog: PresswallEditor["catalog"];
  customLogos: PresswallEditor["customLogos"];
  isSelected: boolean;
  layoutLabel: string;
  onApply: () => void;
  onCustomize?: () => void;
  previewConfig: ReturnType<typeof applyPresswallTemplate>;
  previewSelections: PresswallEditor["selections"];
  previewTheme: ReturnType<typeof getTemplatePreviewTheme>;
  subtitle: string;
  templateName: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-colors",
        isSelected
          ? "border-primary/40 bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-border/80"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-medium text-sm">{templateName}</p>
            <Badge className="font-normal text-[0.65rem]" variant="secondary">
              {layoutLabel}
            </Badge>
            {isSelected ? (
              <Badge
                className="gap-0.5 font-normal text-[0.65rem]"
                variant="default"
              >
                <IconCircleCheck className="size-3" stroke={2} />
                Active
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mb-2 overflow-hidden rounded-lg border bg-muted/30">
        <OnboardingPreview
          catalog={catalog}
          config={previewConfig}
          customLogos={customLogos}
          previewTheme={previewTheme}
          selections={previewSelections}
        />
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={onApply}
          size="sm"
          type="button"
          variant={isSelected ? "secondary" : "default"}
        >
          {isSelected ? "Selected" : "Apply"}
        </Button>
        {onCustomize ? (
          <Button
            onClick={onCustomize}
            size="sm"
            type="button"
            variant="outline"
          >
            Customize
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function TemplatePicker({
  catalog,
  customLogos,
  matchedTemplateId,
  onApply,
  onCustomize,
  selections,
}: TemplatePickerProps) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-3 p-3">
        <section className="space-y-2">
          <TemplateSectionHeader
            description="Pick a starting look, then customize outlets and styling. Your design saves as the single live press strip for this shop."
            title="Built-in templates"
          />
          {PRESSWALL_TEMPLATES.map((template) => (
            <TemplateRow
              catalog={catalog}
              customLogos={customLogos}
              isSelected={matchedTemplateId === template.id}
              key={template.id}
              layoutLabel={templateLayoutLabel(template.config.layout)}
              onApply={() => onApply(template.id)}
              onCustomize={onCustomize}
              previewConfig={applyPresswallTemplate(template.id)}
              previewSelections={selections}
              previewTheme={getTemplatePreviewTheme(template.id)}
              subtitle={template.description}
              templateName={template.name}
            />
          ))}
        </section>
      </div>
    </ScrollArea>
  );
}
