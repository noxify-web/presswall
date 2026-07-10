"use client";

import { useEffect } from "react";
import { HomeShellSkeleton } from "@/components/presswall/home-shell-skeleton";
import { MerchantOverview } from "@/components/presswall/merchant-overview";
import { OnboardingAdminView } from "@/components/presswall/onboarding-admin-view";
import { ThemeActivationProvider } from "@/components/presswall/theme-activation-provider";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  type PresswallEditor,
  usePresswallEditor,
} from "@/hooks/use-presswall-editor";
import { EDITOR_APP_WINDOW_CLOSED_EVENT } from "@/lib/editor-app-window";
import { merchantOverviewFromEditor } from "@/lib/merchant-overview-data";

export function AdminDashboardView({ editor }: { editor: PresswallEditor }) {
  if (editor.isLoading) {
    return <HomeShellSkeleton />;
  }

  if (editor.loadError) {
    return (
      <div className="flex h-svh items-center justify-center p-6">
        <Empty className="max-w-md border">
          <EmptyHeader>
            <EmptyTitle>Could not load Presswall</EmptyTitle>
            <EmptyDescription>
              Settings failed to load. Reload the app from Shopify admin, or
              email support@noxify.io if it keeps happening.
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

  if (editor.needsOnboarding) {
    return <OnboardingAdminView editor={editor} />;
  }

  return (
    <ThemeActivationProvider>
      <MerchantOverview data={merchantOverviewFromEditor(editor)} />
    </ThemeActivationProvider>
  );
}

export function AdminDashboard() {
  const editor = usePresswallEditor();

  useEffect(() => {
    const onEditorWindowClosed = () => {
      editor.reload().catch(() => undefined);
    };

    window.addEventListener(
      EDITOR_APP_WINDOW_CLOSED_EVENT,
      onEditorWindowClosed
    );
    return () => {
      window.removeEventListener(
        EDITOR_APP_WINDOW_CLOSED_EVENT,
        onEditorWindowClosed
      );
    };
  }, [editor.reload]);

  return <AdminDashboardView editor={editor} />;
}
