"use client";

import { IconCircleCheck } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { OnboardingPreview } from "@/components/presswall/onboarding-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import type { ShopBanner } from "@/lib/banner-service";
import {
  applyPresswallTemplate,
  getConfigPreviewTheme,
  getTemplatePreviewTheme,
  PRESSWALL_TEMPLATES,
  type PresswallTemplate,
  type PresswallTemplateId,
} from "@/lib/presswall-templates";
import { cn } from "@/lib/utils";

interface TemplatePickerProps {
  catalog: PresswallEditor["catalog"];
  customLogos: PresswallEditor["customLogos"];
  customTemplates?: ShopBanner[];
  /** When true, hide merchant Saved banners (onboarding step 2). */
  hideSavedBanners?: boolean;
  matchedCustomTemplateId: string | null;
  matchedTemplateId: PresswallTemplateId | null;
  onApply: (templateId: PresswallTemplateId) => void;
  onApplyCustom: (templateId: string) => void;
  onCustomize?: () => void;
  onGoToPlacement?: () => void;
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

  return "Static grid";
}

function TemplateRow({
  catalog,
  customLogos,
  isSelected,
  onApply,
  onCustomize,
  previewConfig,
  previewSelections,
  previewTheme,
  subtitle,
  templateName,
  layoutLabel,
}: {
  catalog: PresswallEditor["catalog"];
  customLogos: PresswallEditor["customLogos"];
  isSelected: boolean;
  layoutLabel: string;
  onApply: () => void;
  onCustomize?: () => void;
  previewConfig: PresswallEditor["config"];
  previewSelections: PresswallEditor["selections"];
  previewTheme: "light" | "dark";
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
          customLogos={customLogos}
          previewTheme={previewTheme}
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
  customLogos,
  customTemplates = [],
  hideSavedBanners = false,
  matchedCustomTemplateId,
  matchedTemplateId,
  onApply,
  onApplyCustom,
  onCustomize,
  onGoToPlacement,
  selections,
}: TemplatePickerProps) {
  const visibleCustomTemplates = hideSavedBanners ? [] : customTemplates;
  const showSavedBanners = visibleCustomTemplates.length > 0;

  const placementAction = onGoToPlacement ? (
    <Button
      className="h-auto shrink-0 px-0 text-xs"
      onClick={onGoToPlacement}
      type="button"
      variant="link"
    >
      Assign to pages
    </Button>
  ) : null;

  let builtInTemplatesDescription =
    "Pick a starting look, then customize outlets and styling. Use Save as template to keep your design for later.";
  if (hideSavedBanners) {
    builtInTemplatesDescription =
      "Pick a starting look, then customize outlets and styling.";
  } else if (showSavedBanners) {
    builtInTemplatesDescription =
      "Starting points from Presswall. Apply one, then customize outlets and styling.";
  } else if (onGoToPlacement) {
    builtInTemplatesDescription =
      "Pick a starting look, then customize outlets and styling. Use Save as template to keep your design and assign it to specific pages.";
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-3 p-3">
        {showSavedBanners ? (
          <section className="space-y-2">
            <TemplateSectionHeader
              action={placementAction}
              description={
                onGoToPlacement
                  ? "Banners you saved from the editor. Use Assign to pages to choose which banner shows on your homepage, product pages, or individual products."
                  : "Banners you saved from the editor. You can assign them to pages later from the editor."
              }
              title="Saved banners"
            />
            {visibleCustomTemplates.map((template) => (
              <TemplateRow
                catalog={catalog}
                customLogos={customLogos}
                isSelected={matchedCustomTemplateId === template.id}
                key={template.id}
                layoutLabel={templateLayoutLabel(template.config.layout)}
                onApply={() => onApplyCustom(template.id)}
                onCustomize={onCustomize}
                previewConfig={template.config}
                previewSelections={template.selections}
                previewTheme={getConfigPreviewTheme(template.config)}
                subtitle={
                  template.description ??
                  "Your saved banner with styling and outlets."
                }
                templateName={template.name}
              />
            ))}
          </section>
        ) : null}

        <section
          className={showSavedBanners ? "space-y-2 border-t pt-4" : "space-y-2"}
        >
          <TemplateSectionHeader
            action={showSavedBanners ? undefined : placementAction}
            description={builtInTemplatesDescription}
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
