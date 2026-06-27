"use client";

import {
  type Icon,
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
} from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { PresswallConfig } from "@/lib/presswall-types";
import { cn } from "@/lib/utils";

function sliderValue(value: number | readonly number[]): number {
  if (typeof value === "number") {
    return value;
  }
  return value[0] ?? 0;
}

const ALIGNMENT_OPTIONS: {
  value: PresswallConfig["alignment"];
  icon: Icon;
  label: string;
}[] = [
  { value: "left", icon: IconAlignLeft, label: "Left" },
  { value: "center", icon: IconAlignCenter, label: "Center" },
  { value: "right", icon: IconAlignRight, label: "Right" },
];

const LAYOUT_OPTIONS: {
  value: PresswallConfig["layout"];
  label: string;
  description: string;
}[] = [
  {
    value: "bar",
    label: "Bar",
    description: "Single row of logos",
  },
  {
    value: "grid",
    label: "Grid",
    description: "Multi-column layout",
  },
  {
    value: "marquee",
    label: "Marquee",
    description: "Continuous scroll",
  },
];

interface StyleControlsProps {
  config: PresswallConfig;
  onUpdate: <K extends keyof PresswallConfig>(
    key: K,
    value: PresswallConfig[K]
  ) => void;
}

function ControlRow({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-sm">{label}</Label>
        {hint ? (
          <span className="text-muted-foreground text-xs">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function StyleControls({ config, onUpdate }: StyleControlsProps) {
  return (
    <div className="grid gap-5">
      <section className="grid gap-3 rounded-lg border p-3 sm:p-4">
        <h3 className="font-medium text-sm">Heading</h3>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm">Show &ldquo;As seen on&rdquo; label</p>
            <p className="text-muted-foreground text-xs">
              Small caption above your logos
            </p>
          </div>
          <Switch
            checked={config.showHeading}
            onCheckedChange={(checked) => onUpdate("showHeading", checked)}
          />
        </div>
        {config.showHeading ? (
          <ControlRow label="Label text">
            <Input
              onChange={(event) => onUpdate("headingText", event.target.value)}
              placeholder="As seen on"
              value={config.headingText}
            />
          </ControlRow>
        ) : null}
      </section>

      <section className="grid gap-3 rounded-lg border p-3 sm:p-4">
        <h3 className="font-medium text-sm">Layout</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {LAYOUT_OPTIONS.map((option) => (
            <button
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-md border px-2.5 py-2 text-left transition-colors",
                config.layout === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              )}
              key={option.value}
              onClick={() => onUpdate("layout", option.value)}
              type="button"
            >
              <span className="font-medium text-xs">{option.label}</span>
              <span className="text-[0.625rem] text-muted-foreground leading-tight">
                {option.description}
              </span>
            </button>
          ))}
        </div>

        {config.layout === "grid" ? null : (
          <ControlRow label="Alignment">
            <div className="grid grid-cols-3 gap-1.5">
              {ALIGNMENT_OPTIONS.map((option) => {
                const AlignIcon = option.icon;
                return (
                  <button
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-md border py-2 transition-colors",
                      config.alignment === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                    key={option.value}
                    onClick={() => onUpdate("alignment", option.value)}
                    type="button"
                  >
                    <AlignIcon className="size-4" stroke={2} />
                    <span className="text-[0.625rem]">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </ControlRow>
        )}

        <ControlRow hint={`${config.gap}px`} label="Spacing between logos">
          <Slider
            max={64}
            min={8}
            onValueChange={(value) => onUpdate("gap", sliderValue(value))}
            step={2}
            value={[config.gap]}
          />
        </ControlRow>

        {config.layout === "marquee" ? (
          <ControlRow hint={`${config.marqueeSpeed}s`} label="Scroll speed">
            <Slider
              max={80}
              min={10}
              onValueChange={(value) =>
                onUpdate("marqueeSpeed", sliderValue(value))
              }
              step={5}
              value={[config.marqueeSpeed]}
            />
          </ControlRow>
        ) : null}
      </section>

      <section className="grid gap-3 rounded-lg border p-3 sm:p-4">
        <h3 className="font-medium text-sm">Logos</h3>
        <ControlRow label="Color mode">
          <Select
            onValueChange={(value) =>
              onUpdate("colorMode", value as PresswallConfig["colorMode"])
            }
            value={config.colorMode}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mono">Black &amp; white</SelectItem>
              <SelectItem value="muted">Muted grayscale</SelectItem>
              <SelectItem value="color">Full color</SelectItem>
            </SelectContent>
          </Select>
        </ControlRow>

        {config.colorMode === "muted" ? (
          <ControlRow
            hint={`${config.grayscaleOpacity}%`}
            label="Muted opacity"
          >
            <Slider
              max={100}
              min={20}
              onValueChange={(value) =>
                onUpdate("grayscaleOpacity", sliderValue(value))
              }
              step={5}
              value={[config.grayscaleOpacity]}
            />
          </ControlRow>
        ) : null}

        <ControlRow hint={`${config.logoHeight}px`} label="Logo height">
          <Slider
            max={80}
            min={16}
            onValueChange={(value) =>
              onUpdate("logoHeight", sliderValue(value))
            }
            step={2}
            value={[config.logoHeight]}
          />
        </ControlRow>
      </section>

      <section className="grid gap-3 rounded-lg border p-3 sm:p-4">
        <h3 className="font-medium text-sm">Container</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <ControlRow label="Text color">
            <div className="flex gap-2">
              <input
                aria-label="Text color picker"
                className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
                onChange={(event) => onUpdate("textColor", event.target.value)}
                type="color"
                value={
                  config.textColor.startsWith("#")
                    ? config.textColor
                    : "#111111"
                }
              />
              <Input
                className="font-mono text-xs"
                onChange={(event) => onUpdate("textColor", event.target.value)}
                value={config.textColor}
              />
            </div>
          </ControlRow>
          <ControlRow label="Background">
            <Input
              className="font-mono text-xs"
              onChange={(event) =>
                onUpdate("backgroundColor", event.target.value)
              }
              placeholder="transparent"
              value={config.backgroundColor}
            />
          </ControlRow>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ControlRow hint={`${config.paddingY}px`} label="Padding vertical">
            <Slider
              max={80}
              min={0}
              onValueChange={(value) =>
                onUpdate("paddingY", sliderValue(value))
              }
              step={2}
              value={[config.paddingY]}
            />
          </ControlRow>
          <ControlRow hint={`${config.paddingX}px`} label="Padding horizontal">
            <Slider
              max={80}
              min={0}
              onValueChange={(value) =>
                onUpdate("paddingX", sliderValue(value))
              }
              step={2}
              value={[config.paddingX]}
            />
          </ControlRow>
        </div>

        <ControlRow hint={`${config.borderRadius}px`} label="Corner radius">
          <Slider
            max={32}
            min={0}
            onValueChange={(value) =>
              onUpdate("borderRadius", sliderValue(value))
            }
            step={2}
            value={[config.borderRadius]}
          />
        </ControlRow>
      </section>
    </div>
  );
}
