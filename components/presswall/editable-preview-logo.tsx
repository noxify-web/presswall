"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EditablePreviewLogoProps {
  children: ReactNode;
  className?: string;
  label: string;
  onReplace: () => void;
}

/**
 * Live-preview wrapper: on hover, blur the logo and show a centered "Change"
 * text control. Uses xyflow `nodrag` / `nopan` so clicks don't pan the canvas.
 */
export function EditablePreviewLogo({
  children,
  className,
  label,
  onReplace,
}: EditablePreviewLogoProps) {
  return (
    <div
      className={cn(
        "nodrag nopan group/logo pointer-events-auto relative inline-flex min-w-0 max-w-full shrink items-center justify-center",
        className
      )}
    >
      <div className="transition-[filter,opacity] duration-150 group-focus-within/logo:opacity-40 group-focus-within/logo:blur-[2px] group-hover/logo:opacity-40 group-hover/logo:blur-[2px]">
        {children}
      </div>

      <button
        aria-label={`Change ${label} logo`}
        className={cn(
          "absolute inset-0 z-10 flex items-center justify-center rounded-md",
          "opacity-0 transition-opacity duration-150",
          "focus-visible:opacity-100 group-hover/logo:opacity-100",
          "focus-visible:outline-none"
        )}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          onReplace();
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        type="button"
      >
        <span
          className={cn(
            "rounded-md border border-black/10 bg-background px-3 py-1.5",
            "font-semibold text-foreground text-sm shadow-md"
          )}
        >
          Change
        </span>
      </button>
    </div>
  );
}
