"use client";

import { IconDeviceDesktop, IconDeviceMobile } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { PresswallViewport } from "@/lib/presswall-layout-style";

interface DeviceToggleProps {
  mode: PresswallViewport;
  onChange: (mode: PresswallViewport) => void;
}

export function DeviceToggle({ mode, onChange }: DeviceToggleProps) {
  return (
    <fieldset className="inline-flex rounded-lg border bg-background p-0.5">
      <Button
        aria-pressed={mode === "desktop"}
        className="h-7 gap-1.5 px-2.5 text-xs"
        onClick={() => onChange("desktop")}
        size="sm"
        type="button"
        variant={mode === "desktop" ? "secondary" : "ghost"}
      >
        <IconDeviceDesktop className="size-3.5" stroke={2} />
        Desktop
      </Button>
      <Button
        aria-pressed={mode === "mobile"}
        className="h-7 gap-1.5 px-2.5 text-xs"
        onClick={() => onChange("mobile")}
        size="sm"
        type="button"
        variant={mode === "mobile" ? "secondary" : "ghost"}
      >
        <IconDeviceMobile className="size-3.5" stroke={2} />
        Mobile
      </Button>
    </fieldset>
  );
}
