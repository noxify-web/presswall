"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { EditorShellSkeleton } from "@/components/presswall/editor-shell-skeleton";
import { EditorWorkspace } from "@/components/presswall/editor-workspace";
import { ThemeActivationBanner } from "@/components/presswall/theme-activation-banner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { usePresswallEditor } from "@/hooks/use-presswall-editor";
import { navigateAdminPath } from "@/lib/admin-navigation";
import { isAppWindowRequest } from "@/lib/editor-app-window";

export function EditorView() {
  const editor = usePresswallEditor();
  const searchParams = useSearchParams();
  const inAppWindow = useMemo(
    () => isAppWindowRequest(searchParams),
    [searchParams]
  );

  useEffect(() => {
    if (!editor.isLoading && editor.needsOnboarding) {
      navigateAdminPath("/").catch(() => undefined);
    }
  }, [editor.isLoading, editor.needsOnboarding]);

  if (editor.isLoading || editor.needsOnboarding) {
    return <EditorShellSkeleton />;
  }

  if (editor.loadError) {
    return (
      <div className="flex h-svh items-center justify-center p-6">
        <Empty className="max-w-md border">
          <EmptyHeader>
            <EmptyTitle>Could not load editor</EmptyTitle>
            <EmptyDescription>
              Settings failed to load. Retry after migrations are applied or
              reload from Shopify admin.
            </EmptyDescription>
          </EmptyHeader>
          <Button
            className="mt-4"
            onClick={() => {
              editor.reload().catch(() => undefined);
            }}
            type="button"
          >
            Retry
          </Button>
        </Empty>
      </div>
    );
  }

  const saveDisabled = !editor.isDirty || editor.isLoading || editor.isSaving;

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      {/*
        App Bridge title bar for fullscreen App Window (and admin chrome on
        the regular /editor route). Save stays in the preview toolbar for the
        in-app control pattern; primary action mirrors it in the native bar.
      */}
      <s-page heading="Edit press logos">
        {editor.isDirty ? (
          <s-badge slot="accessory" tone="warning">
            Unsaved
          </s-badge>
        ) : null}
        <s-button
          disabled={saveDisabled}
          onClick={() => {
            editor.save().catch(() => undefined);
          }}
          slot="primary-action"
        >
          {editor.isSaving ? "Saving..." : "Save"}
        </s-button>
        {editor.isDirty ? (
          <s-button
            disabled={saveDisabled}
            onClick={() => {
              editor.discard();
            }}
            slot="secondary-actions"
          >
            Discard
          </s-button>
        ) : null}
      </s-page>

      {inAppWindow ? null : <ThemeActivationBanner variant="compact" />}

      {editor.unavailableCount > 0 ? (
        <Alert className="shrink-0 rounded-none border-x-0 border-t-0 py-2">
          <AlertTitle className="text-sm">
            Some outlets are no longer available
          </AlertTitle>
          <AlertDescription className="text-xs">
            {editor.unavailableCount} previously selected outlet
            {editor.unavailableCount === 1 ? "" : "s"} will not show on your
            storefront. Remove them or save to update.
          </AlertDescription>
        </Alert>
      ) : null}

      <div
        className={
          inAppWindow
            ? "flex min-h-0 flex-1 flex-col overflow-hidden px-3 pt-3 pb-4 sm:px-4"
            : "flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4 pb-6 sm:px-6"
        }
      >
        <EditorWorkspace editor={editor} fullBleed={inAppWindow} />
      </div>
    </div>
  );
}
