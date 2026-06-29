"use client";

import { useEffect } from "react";
import { EditorWorkspace } from "@/components/presswall/editor-workspace";
import { OnboardingShellSkeleton } from "@/components/presswall/onboarding-shell-skeleton";
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

export function EditorView() {
  const editor = usePresswallEditor();

  useEffect(() => {
    if (!editor.isLoading && editor.needsOnboarding) {
      navigateAdminPath("/").catch(() => undefined);
    }
  }, [editor.isLoading, editor.needsOnboarding]);

  if (editor.isLoading || editor.needsOnboarding) {
    return <OnboardingShellSkeleton />;
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

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <ThemeActivationBanner variant="compact" />

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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4 pb-6 sm:px-6">
        <EditorWorkspace editor={editor} />
      </div>
    </div>
  );
}
