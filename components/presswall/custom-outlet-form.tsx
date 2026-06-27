"use client";

import { IconInfoCircle, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LOGO_GUIDANCE } from "@/lib/logo-guidance";

interface CustomOutletFormProps {
  onAdd: (name: string, svg: string) => void;
}

export function CustomOutletForm({ onAdd }: CustomOutletFormProps) {
  const [customName, setCustomName] = useState("");
  const [customSvg, setCustomSvg] = useState("");

  const handleAdd = () => {
    if (!customName.trim()) {
      return;
    }
    onAdd(customName.trim(), customSvg.trim());
    setCustomName("");
    setCustomSvg("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="custom-name">Outlet name</Label>
        <Input
          autoFocus
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

      <div className="grid gap-1.5">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="custom-svg">Logo SVG</Label>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  type="button"
                >
                  <IconInfoCircle className="size-3.5" stroke={2} />
                </button>
              }
            />
            <TooltipContent className="max-w-xs">
              <p className="mb-1 font-medium">{LOGO_GUIDANCE.title}</p>
              <p className="text-xs">{LOGO_GUIDANCE.summary}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Textarea
          className="min-h-[5rem] font-mono text-xs"
          id="custom-svg"
          onChange={(event) => setCustomSvg(event.target.value)}
          placeholder='<svg xmlns="http://www.w3.org/2000/svg" ...>'
          rows={3}
          value={customSvg}
        />
        <p className="text-muted-foreground text-xs">
          Paste inline SVG with a transparent background for best results.
        </p>
      </div>

      <Button
        className="w-full"
        disabled={!customName.trim()}
        onClick={handleAdd}
      >
        <IconPlus stroke={2} />
        Add outlet
      </Button>
    </div>
  );
}
