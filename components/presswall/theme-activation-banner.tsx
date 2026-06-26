"use client";

import { IconAlertTriangle, IconX } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin-fetch";
import type { ThemeActivationStatus } from "@/lib/theme-activation";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "presswall-theme-activation-dismissed";

interface ThemeActivationBannerProps {
  className?: string;
}

export function ThemeActivationBanner({
  className,
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
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-amber-200/80 bg-card shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 bg-amber-400 px-4 py-3 text-amber-950">
        <div className="flex items-center gap-2">
          <IconAlertTriangle className="size-5 shrink-0" stroke={2} />
          <p className="font-semibold text-sm">
            Activate Presswall on your store
          </p>
        </div>
        <button
          aria-label="Dismiss activation reminder"
          className="rounded-md p-1 text-amber-950/80 transition-colors hover:bg-amber-500/30 hover:text-amber-950"
          onClick={dismiss}
          type="button"
        >
          <IconX className="size-4" stroke={2} />
        </button>
      </div>

      <div className="space-y-4 px-4 py-4">
        <p className="text-sm leading-relaxed">
          Enable the Presswall app embed so your &ldquo;as seen on&rdquo; logos
          appear on your storefront. After enabling, save your theme changes in
          the editor.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              window.open(status.activateEmbedUrl, "_top");
            }}
          >
            Activate now
          </Button>
          <Button
            onClick={() => {
              window.open(status.activateSectionUrl, "_top");
            }}
            variant="outline"
          >
            Add as section block
          </Button>
        </div>

        {status.themeName ? (
          <p className="text-muted-foreground text-xs">
            Checking theme: {status.themeName}
          </p>
        ) : null}
      </div>
    </div>
  );
}
