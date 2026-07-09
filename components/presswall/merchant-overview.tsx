"use client";

import {
  IconCircleCheck,
  IconEdit,
  IconExternalLink,
  IconLoader2,
  IconRefresh,
} from "@tabler/icons-react";
import { useContext, useState } from "react";
import { DeviceToggle } from "@/components/presswall/device-toggle";
import { OnboardingPreviewCanvas } from "@/components/presswall/onboarding-preview-canvas";
import { ThemeActivationBanner } from "@/components/presswall/theme-activation-banner";
import { ThemeActivationContext } from "@/components/presswall/theme-activation-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { openEditorAppWindow } from "@/lib/editor-app-window";
import type { MerchantOverviewData } from "@/lib/merchant-overview-data";
import type { PresswallViewport } from "@/lib/presswall-layout-style";

interface MerchantOverviewProps {
  data: MerchantOverviewData;
}

const PLACEMENT_STEPS = [
  "Enable the app embed so your strip can load on the storefront.",
  "Add the Presswall block to high-trust templates like your homepage or product page.",
  "Save the theme, then preview your store to confirm placement.",
] as const;

function buildHomepageSectionUrl(activateSectionUrl: string): string {
  const url = new URL(activateSectionUrl);
  url.searchParams.set("template", "index");
  return url.toString();
}

function openThemeEditor(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function EmbedStatusBadge({
  isActive,
  isChecking,
}: {
  isActive: boolean;
  isChecking: boolean;
}) {
  if (isChecking) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
        <IconLoader2 className="size-3 animate-spin" stroke={2} />
        Checking
      </span>
    );
  }

  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 text-xs">
        <IconCircleCheck className="size-3" stroke={2.5} />
        Enabled
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-amber-800 text-xs">
      Not enabled
    </span>
  );
}

function StorefrontEmbedCard() {
  const activation = useContext(ThemeActivationContext);
  const [isChecking, setIsChecking] = useState(false);

  const status = activation?.status ?? null;
  const isLoading = activation?.isLoading ?? true;
  const isActive = status?.isActive ?? false;

  const handleCheckStatus = () => {
    if (!activation) {
      return;
    }

    setIsChecking(true);
    activation.reload().finally(() => {
      setIsChecking(false);
    });
  };

  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="gap-1.5 border-b pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-sm">Storefront embed</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Required for your press strip to appear on the live store.
            </CardDescription>
          </div>
          <div className="shrink-0 pt-0.5">
            <EmbedStatusBadge
              isActive={isActive}
              isChecking={isLoading || isChecking}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        <div className="flex flex-1 flex-col gap-2">
          {status?.themeName ? (
            <p className="text-muted-foreground text-xs">
              Theme:{" "}
              <span className="font-medium text-foreground">
                {status.themeName}
              </span>
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">Theme: —</p>
          )}

          <p className="text-muted-foreground text-xs leading-relaxed">
            {isActive
              ? "Presswall is enabled on your storefront. Open the theme editor anytime to review embed settings."
              : "Turn on the Presswall app embed in your theme editor, save, then check status here."}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          <Button
            disabled={!status?.activateEmbedUrl || isLoading}
            onClick={() => {
              if (status?.activateEmbedUrl) {
                openThemeEditor(status.activateEmbedUrl);
              }
            }}
            size="sm"
            type="button"
          >
            <IconExternalLink stroke={2} />
            {isActive ? "Open theme editor" : "Enable app embed"}
          </Button>
          <Button
            disabled={isLoading || isChecking}
            onClick={handleCheckStatus}
            size="sm"
            type="button"
            variant="outline"
          >
            {isChecking ? (
              <IconLoader2 className="size-4 animate-spin" stroke={2} />
            ) : (
              <IconRefresh stroke={2} />
            )}
            Check status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ThemePlacementCard() {
  const activation = useContext(ThemeActivationContext);
  const status = activation?.status ?? null;
  const homepageUrl = status?.activateSectionUrl
    ? buildHomepageSectionUrl(status.activateSectionUrl)
    : null;

  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="gap-1.5 border-b pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-sm">Add to your theme</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Place the Presswall block where shoppers will see it.
            </CardDescription>
          </div>
          {/* Spacer keeps header height aligned with the embed status badge */}
          <div aria-hidden className="invisible shrink-0 pt-0.5">
            <EmbedStatusBadge isActive isChecking={false} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        <ol className="flex flex-1 flex-col gap-2">
          {PLACEMENT_STEPS.map((step, index) => (
            <li
              className="flex items-start gap-2 text-muted-foreground text-xs leading-relaxed"
              key={step}
            >
              <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border bg-muted/40 font-medium text-[0.625rem] text-foreground tabular-nums">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-auto flex flex-wrap gap-2">
          <Button
            disabled={!homepageUrl}
            onClick={() => {
              if (homepageUrl) {
                openThemeEditor(homepageUrl);
              }
            }}
            size="sm"
            type="button"
          >
            <IconExternalLink stroke={2} />
            Add to homepage
          </Button>
          <Button
            disabled={!status?.activateSectionUrl}
            onClick={() => {
              if (status?.activateSectionUrl) {
                openThemeEditor(status.activateSectionUrl);
              }
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            <IconExternalLink stroke={2} />
            Add to product page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function MerchantOverview({ data }: MerchantOverviewProps) {
  const [deviceMode, setDeviceMode] = useState<PresswallViewport>("desktop");
  const [isOpeningEditor, setIsOpeningEditor] = useState(false);

  const handleOpenEditor = () => {
    setIsOpeningEditor(true);
    openEditorAppWindow()
      .catch(() => undefined)
      .finally(() => {
        setIsOpeningEditor(false);
      });
  };

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <ThemeActivationBanner variant="compact" />

      {data.unavailableCount > 0 ? (
        <Alert className="shrink-0 rounded-none border-x-0 border-t-0 py-2">
          <AlertTitle className="text-sm">
            Some outlets are no longer available
          </AlertTitle>
          <AlertDescription className="text-xs">
            {data.unavailableCount} selected outlet
            {data.unavailableCount === 1 ? "" : "s"} will not show on your
            storefront. Open the editor to update your strip.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4 pb-6 sm:px-6">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
              <p className="font-medium text-sm">Storefront preview</p>
              <div className="flex items-center gap-2">
                <DeviceToggle mode={deviceMode} onChange={setDeviceMode} />
                <Button
                  disabled={isOpeningEditor}
                  onClick={handleOpenEditor}
                  size="sm"
                  type="button"
                >
                  {isOpeningEditor ? (
                    <IconLoader2 className="size-4 animate-spin" stroke={2} />
                  ) : (
                    <IconEdit stroke={2} />
                  )}
                  {isOpeningEditor ? "Opening..." : "Open editor"}
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1">
              <OnboardingPreviewCanvas
                catalog={data.catalog}
                config={data.config}
                customLogos={data.customLogos}
                deviceMode={deviceMode}
                selections={data.selections}
              />
            </div>
          </div>

          <div className="grid shrink-0 items-stretch gap-3 md:grid-cols-2">
            <StorefrontEmbedCard />
            <ThemePlacementCard />
          </div>
        </div>
      </div>
    </div>
  );
}
