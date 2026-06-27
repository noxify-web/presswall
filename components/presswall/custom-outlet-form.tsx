"use client";

import { IconChevronDown, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LOGO_GUIDANCE } from "@/lib/logo-guidance";
import { cn } from "@/lib/utils";

interface CustomOutletFormProps {
  onAdd: (name: string, svg: string) => void;
}

export function CustomOutletForm({ onAdd }: CustomOutletFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customSvg, setCustomSvg] = useState("");

  const handleAdd = () => {
    if (!customName.trim()) {
      return;
    }
    onAdd(customName.trim(), customSvg.trim());
    setCustomName("");
    setCustomSvg("");
    setExpanded(false);
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <button
        className="flex w-full items-center justify-between text-left"
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        <div>
          <p className="font-medium text-sm">Add custom outlet</p>
          <p className="text-muted-foreground text-xs">
            For podcasts, local news, or blogs not in the library
          </p>
        </div>
        <IconChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
          stroke={2}
        />
      </button>

      {expanded ? (
        <div className="flex flex-col gap-3 pt-1">
          <div className="grid gap-2">
            <Label htmlFor="custom-name">Outlet name</Label>
            <Input
              id="custom-name"
              onChange={(event) => setCustomName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleAdd();
                }
              }}
              placeholder="Podcast, local news, blog..."
              value={customName}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="custom-svg">
              Logo SVG{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="custom-svg"
              onChange={(event) => setCustomSvg(event.target.value)}
              placeholder='Paste inline SVG with a transparent background, e.g. <svg xmlns="http://www.w3.org/2000/svg" ...>'
              rows={3}
              value={customSvg}
            />
            <details className="text-muted-foreground text-xs">
              <summary className="cursor-pointer select-none">
                {LOGO_GUIDANCE.title}
              </summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {LOGO_GUIDANCE.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </details>
          </div>
          <Button
            disabled={!customName.trim()}
            onClick={handleAdd}
            variant="outline"
          >
            <IconPlus stroke={2} />
            Add outlet
          </Button>
        </div>
      ) : null}
    </div>
  );
}
