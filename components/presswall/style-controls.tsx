"use client";

import {
  type Icon,
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const COLOR_MODES: {
  value: PresswallConfig["colorMode"];
  label: string;
  hint: string;
}[] = [
  { value: "mono", label: "B&W", hint: "Black & white" },
  { value: "muted", label: "Muted", hint: "Grayscale" },
  { value: "color", label: "Color", hint: "Full color" },
];

const LAYOUTS: {
  value: PresswallConfig["layout"];
  label: string;
  hint: string;
}[] = [
  { value: "bar", label: "Bar", hint: "Horizontal row" },
  { value: "grid", label: "Grid", hint: "Multi-row grid" },
  { value: "marquee", label: "Marquee", hint: "Auto-scroll" },
];

interface StyleControlsProps {
  config: PresswallConfig;
  onUpdate: <K extends keyof PresswallConfig>(
    key: K,
    value: PresswallConfig[K]
  ) => void;
}

interface ColorFieldProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  supportsTransparent?: boolean;
  value: string;
}

function ColorField({
  value,
  onChange,
  placeholder,
  disabled,
  supportsTransparent,
}: ColorFieldProps) {
  const isTransparent = supportsTransparent && value === "transparent";
  const colorValue = isTransparent ? "#ffffff" : value;

  return (
    <div className="flex items-center gap-2">
      <input
        aria-label="Color picker"
        className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled || isTransparent}
        onChange={(event) => onChange(event.target.value)}
        type="color"
        value={colorValue}
      />
      <Input
        className="flex-1 font-mono text-sm"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

export function StyleControls({ config, onUpdate }: StyleControlsProps) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-lg">Content</h2>
          <p className="text-muted-foreground text-sm">
            Customize the heading above your logos.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="show-heading">Show heading</Label>
            <p className="text-muted-foreground text-xs">
              Display a label above your logos
            </p>
          </div>
          <Switch
            checked={config.showHeading}
            id="show-heading"
            onCheckedChange={(checked) => onUpdate("showHeading", checked)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="heading-text">Heading text</Label>
          <Input
            disabled={!config.showHeading}
            id="heading-text"
            onChange={(event) => onUpdate("headingText", event.target.value)}
            placeholder="As seen on"
            value={config.headingText}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-lg">Logo style</h2>
          <p className="text-muted-foreground text-sm">
            Control how your press logos look.
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Color mode</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {COLOR_MODES.map((mode) => (
              <Button
                className={cn(
                  "flex-col gap-0.5 py-2",
                  config.colorMode === mode.value && "border-ring bg-muted"
                )}
                key={mode.value}
                onClick={() => onUpdate("colorMode", mode.value)}
                variant="outline"
              >
                <span className="font-medium text-sm">{mode.label}</span>
                <span className="text-[0.625rem] text-muted-foreground">
                  {mode.hint}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {config.colorMode === "muted" ? (
          <div className="grid gap-2">
            <Label>Muted opacity ({config.grayscaleOpacity}%)</Label>
            <Slider
              max={100}
              min={20}
              onValueChange={(value) =>
                onUpdate("grayscaleOpacity", sliderValue(value))
              }
              step={5}
              value={[config.grayscaleOpacity]}
            />
          </div>
        ) : null}

        <div className="grid gap-2">
          <Label>Logo height ({config.logoHeight}px)</Label>
          <Slider
            max={80}
            min={16}
            onValueChange={(value) =>
              onUpdate("logoHeight", sliderValue(value))
            }
            step={2}
            value={[config.logoHeight]}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="text-color">Text color</Label>
            <ColorField
              onChange={(value) => onUpdate("textColor", value)}
              value={config.textColor}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="background-color">Background</Label>
            <ColorField
              onChange={(value) => onUpdate("backgroundColor", value)}
              placeholder="transparent"
              supportsTransparent
              value={config.backgroundColor}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-lg">Layout</h2>
          <p className="text-muted-foreground text-sm">
            Control how logos are arranged and spaced.
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Layout type</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {LAYOUTS.map((layout) => (
              <Button
                className={cn(
                  "flex-col gap-0.5 py-2",
                  config.layout === layout.value && "border-ring bg-muted"
                )}
                key={layout.value}
                onClick={() => onUpdate("layout", layout.value)}
                variant="outline"
              >
                <span className="font-medium text-sm">{layout.label}</span>
                <span className="text-[0.625rem] text-muted-foreground">
                  {layout.hint}
                </span>
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Alignment</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {ALIGNMENT_OPTIONS.map((option) => {
              const AlignIcon = option.icon;
              return (
                <Button
                  className={cn(
                    "flex-col gap-0.5 py-2",
                    config.alignment === option.value && "border-ring bg-muted"
                  )}
                  key={option.value}
                  onClick={() => onUpdate("alignment", option.value)}
                  variant="outline"
                >
                  <AlignIcon stroke={2} />
                  <span className="text-[0.625rem]">{option.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Gap ({config.gap}px)</Label>
          <Slider
            max={64}
            min={8}
            onValueChange={(value) => onUpdate("gap", sliderValue(value))}
            step={2}
            value={[config.gap]}
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Padding Y ({config.paddingY}px)</Label>
            <Slider
              max={80}
              min={0}
              onValueChange={(value) =>
                onUpdate("paddingY", sliderValue(value))
              }
              step={2}
              value={[config.paddingY]}
            />
          </div>
          <div className="grid gap-2">
            <Label>Padding X ({config.paddingX}px)</Label>
            <Slider
              max={80}
              min={0}
              onValueChange={(value) =>
                onUpdate("paddingX", sliderValue(value))
              }
              step={2}
              value={[config.paddingX]}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Corner radius ({config.borderRadius}px)</Label>
          <Slider
            max={32}
            min={0}
            onValueChange={(value) =>
              onUpdate("borderRadius", sliderValue(value))
            }
            step={2}
            value={[config.borderRadius]}
          />
        </div>

        {config.layout === "marquee" ? (
          <div className="grid gap-2">
            <Label>Scroll speed ({config.marqueeSpeed}s)</Label>
            <Slider
              max={80}
              min={10}
              onValueChange={(value) =>
                onUpdate("marqueeSpeed", sliderValue(value))
              }
              step={5}
              value={[config.marqueeSpeed]}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
