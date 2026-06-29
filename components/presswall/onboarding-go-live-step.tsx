"use client";

import { IconCircleCheck, IconExternalLink } from "@tabler/icons-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { OnboardingActions } from "@/components/presswall/onboarding-actions";
import { OnboardingPreview } from "@/components/presswall/onboarding-preview";
import { Button } from "@/components/ui/button";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import { adminFetch } from "@/lib/admin-fetch";
import {
  getPresswallTemplate,
  type PresswallTemplateId,
} from "@/lib/presswall-templates";
import type { ThemeActivationStatus } from "@/lib/theme-activation";

interface OnboardingGoLiveStepProps {
  dots: ReactNode;
  editor: PresswallEditor;
  onBack: () => void;
  onComplete: () => void;
}

function templatePreviewTheme(
  templateId: PresswallTemplateId
): "light" | "dark" {
  return templateId === "dark" ? "dark" : "light";
}

export function OnboardingGoLiveStep({
  dots,
  editor,
  onBack,
  onComplete,
}: OnboardingGoLiveStepProps) {
  const [status, setStatus] = useState<ThemeActivationStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);

  const loadStatus = useCallback(async () => {
    setIsChecking(true);

    try {
      const response = await adminFetch("/api/theme-activation");
      if (!response.ok) {
        setStatus(null);
        return;
      }

      const data = (await response.json()) as ThemeActivationStatus;
      setStatus(data);

      if (data.isActive) {
        setAcknowledged(true);
      }
    } catch {
      setStatus(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    loadStatus().catch(() => undefined);
  }, [loadStatus]);

  useEffect(() => {
    const refreshStatus = () => {
      if (document.visibilityState === "visible") {
        loadStatus().catch(() => undefined);
      }
    };

    document.addEventListener("visibilitychange", refreshStatus);
    window.addEventListener("focus", refreshStatus);

    return () => {
      document.removeEventListener("visibilitychange", refreshStatus);
      window.removeEventListener("focus", refreshStatus);
    };
  }, [loadStatus]);

  const handleFinish = async () => {
    const saved = await editor.completeOnboarding();
    if (saved) {
      onComplete();
    }
  };

  const template = getPresswallTemplate(editor.selectedTemplateId);
  const isActive = status?.isActive ?? false;

  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col gap-6">
      <p className="shrink-0 text-right text-muted-foreground text-xs">
        Step 3 of 3 — Go live on your store
      </p>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        <OnboardingPreview
          catalog={editor.catalog}
          config={editor.config}
          previewTheme={templatePreviewTheme(editor.selectedTemplateId)}
          scale="lg"
          selections={editor.selections}
        />

        <div className="space-y-4 rounded-xl border p-5">
          {isActive ? (
            <div className="flex items-center gap-3 text-sm">
              <IconCircleCheck
                className="size-5 shrink-0 text-emerald-600"
                stroke={2}
              />
              <p>Presswall is active on your theme.</p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Open your theme editor and turn on the Presswall app embed. Save
                your theme when you&apos;re done.
              </p>
              <Button
                className="w-full"
                disabled={!status?.activateEmbedUrl || isChecking}
                onClick={() => {
                  if (status?.activateEmbedUrl) {
                    window.open(
                      status.activateEmbedUrl,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }
                }}
                size="lg"
                variant="outline"
              >
                <IconExternalLink stroke={2} />
                Enable on storefront
              </Button>
              <button
                className="w-full text-center text-muted-foreground text-xs underline-offset-4 hover:text-foreground hover:underline"
                onClick={() => setAcknowledged(true)}
                type="button"
              >
                I&apos;ve enabled it
              </button>
            </>
          )}
        </div>

        <p className="text-center text-muted-foreground text-xs">
          {template.name} template · {editor.selected.length} outlet
          {editor.selected.length === 1 ? "" : "s"}
        </p>
      </div>

      <OnboardingActions
        center={dots}
        className="shrink-0 border-t pt-4"
        compact
        nextDisabled={!(isActive || acknowledged) || isChecking}
        nextLabel="Open editor"
        nextLoading={editor.isSaving}
        onBack={onBack}
        onNext={() => {
          handleFinish().catch(() => undefined);
        }}
        showBack
      />
    </div>
  );
}
