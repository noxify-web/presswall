"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PresswallConfig } from "@/lib/presswall-types";
import { cn } from "@/lib/utils";

const LOGO_COLOR_ITEMS = [
  { value: "color", label: "Colored" },
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
] as const;

type LogoStyleValue = (typeof LOGO_COLOR_ITEMS)[number]["value"];

interface PreviewLogoStyleToggleProps {
  className?: string;
  onChange: (value: PresswallConfig["colorMode"]) => void;
  value: PresswallConfig["colorMode"];
}

/** Live-preview chrome: "Logo color" label + dropdown (Colored / Black / White). */
export function PreviewLogoStyleToggle({
  className,
  onChange,
  value,
}: PreviewLogoStyleToggleProps) {
  const active: LogoStyleValue =
    value === "black" || value === "white" || value === "color"
      ? value
      : "color";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-zinc-200/90 bg-white py-1 pr-1 pl-2.5 shadow-sm",
        className
      )}
    >
      <span className="shrink-0 font-medium text-[0.6875rem] text-zinc-600">
        Logo color
      </span>
      <Select
        items={[...LOGO_COLOR_ITEMS]}
        onValueChange={(next) => {
          if (next === "color" || next === "black" || next === "white") {
            onChange(next);
          }
        }}
        value={active}
      >
        <SelectTrigger
          aria-label="Logo color"
          className="h-7 min-w-[5.5rem] border-zinc-200 bg-white py-0 text-xs shadow-none data-[size=default]:h-7"
          size="sm"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="bg-white" side="top">
          {LOGO_COLOR_ITEMS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
