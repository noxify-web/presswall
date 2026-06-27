"use client";

import {
  IconExternalLink,
  IconLayoutGrid,
  IconPlug,
  IconX,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin-fetch";
import type { ThemeActivationStatus } from "@/lib/theme-activation";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "presswall-theme-activation-dismissed";

interface ThemeActivationBannerProps {
  className?: string;
  isDirty?: boolean;
}

export function ThemeActivationBanner({
  className,
  isDirty = false,
}: ThemeActivationBannerProps) {
  const [status, setStatus] = useState<ThemeActivationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await adminFetch("/api/theme-activation");
      if (!response.ok) {
        setStatus(null);
        return;
      }

      const data = (await response.json()) as ThemeActivationStatus;
      setStatus(data);

      if (data.isActive) {
        sessionStorage.removeItem(DISMISS_KEY);
        setIsDismissed(false);
      }
    } catch {
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    loadStatus().catch(() => undefined);
  }, [loadStatus]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setIsDismissed(true);
  };

  if (isLoading || isDismissed || !status || status.isActive) {
    return null;
  }

  return (
    <div className={cn("rounded-lg border bg-muted/30 p-3 sm:p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-medium text-sm">Add to your Shopify theme</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {isDirty
              ? "Save your changes first, then choose how Presswall appears on your store."
              : "Choose an app embed for site-wide display, or a section block for a specific page."}
          </p>
        </div>
        <button
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={dismiss}
          type="button"
        >
          <IconX className="size-4" stroke={2} />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1 justify-start"
          disabled={isDirty}
          onClick={() => {
            window.open(status.activateEmbedUrl, "_top");
          }}
          size="sm"
          variant="default"
        >
          <IconPlug stroke={2} />
          Enable app embed
          <IconExternalLink
            className="ml-auto size-3.5 opacity-60"
            stroke={2}
          />
        </Button>
        <Button
          className="flex-1 justify-start"
          disabled={isDirty}
          onClick={() => {
            window.open(status.activateSectionUrl, "_top");
          }}
          size="sm"
          variant="outline"
        >
          <IconLayoutGrid stroke={2} />
          Add section block
          <IconExternalLink
            className="ml-auto size-3.5 opacity-60"
            stroke={2}
          />
        </Button>
      </div>
    </div>
  );
}
