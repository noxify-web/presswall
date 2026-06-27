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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

interface StyleControlsProps {
  config: PresswallConfig;
  onUpdate: <K extends keyof PresswallConfig>(
    key: K,
    value: PresswallConfig[K]
  ) => void;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 border-b pb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
      {children}
    </h3>
  );
}

export function StyleControls({ config, onUpdate }: StyleControlsProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* ── Heading ── */}
      <SectionHeading>Heading</SectionHeading>

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

      {/* ── Colors ── */}
      <SectionHeading>Colors</SectionHeading>

      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <Label>Color mode</Label>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button size="icon-sm" variant="ghost">
                  ?
                </Button>
              }
            />
            <TooltipContent>
              Mono and muted modes work best with transparent logos. Full color
              shows original brand marks.
            </TooltipContent>
          </Tooltip>
        </div>
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

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="text-color">Text color</Label>
          <Input
            id="text-color"
            onChange={(event) => onUpdate("textColor", event.target.value)}
            value={config.textColor}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="background-color">Background</Label>
          <Input
            id="background-color"
            onChange={(event) =>
              onUpdate("backgroundColor", event.target.value)
            }
            placeholder="transparent"
            value={config.backgroundColor}
          />
        </div>
      </div>

      {/* ── Layout ── */}
      <SectionHeading>Layout</SectionHeading>

      <div className="grid gap-2">
        <Label>Layout type</Label>
        <Select
          onValueChange={(value) =>
            onUpdate("layout", value as PresswallConfig["layout"])
          }
          value={config.layout}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Horizontal bar</SelectItem>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="marquee">Scrolling marquee</SelectItem>
          </SelectContent>
        </Select>
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
        <Label>Logo height ({config.logoHeight}px)</Label>
        <Slider
          max={80}
          min={16}
          onValueChange={(value) => onUpdate("logoHeight", sliderValue(value))}
          step={2}
          value={[config.logoHeight]}
        />
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

      {/* ── Spacing ── */}
      <SectionHeading>Spacing</SectionHeading>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Padding Y ({config.paddingY}px)</Label>
          <Slider
            max={80}
            min={0}
            onValueChange={(value) => onUpdate("paddingY", sliderValue(value))}
            step={2}
            value={[config.paddingY]}
          />
        </div>
        <div className="grid gap-2">
          <Label>Padding X ({config.paddingX}px)</Label>
          <Slider
            max={80}
            min={0}
            onValueChange={(value) => onUpdate("paddingX", sliderValue(value))}
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
          <Label>Marquee speed ({config.marqueeSpeed}s)</Label>
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
    </div>
  );
}
