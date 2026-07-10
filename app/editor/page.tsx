import { Suspense } from "react";
import { AppEmptyState } from "@/components/presswall/app-empty-state";
import { EditorShellSkeleton } from "@/components/presswall/editor-shell-skeleton";
import { EditorView } from "@/components/presswall/editor-view";
import { authenticatePage } from "@/lib/authenticate-page";
import { hasEmbeddedEntryParams } from "@/lib/embedded-entry";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EditorPage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (!hasEmbeddedEntryParams(params)) {
    return (
      <AppEmptyState
        description="Install and open Presswall from your Shopify admin to edit your press logos."
        title="Open from Shopify admin"
      />
    );
  }

  await authenticatePage(searchParams, "/editor");

  return (
    <Suspense fallback={<EditorShellSkeleton />}>
      <EditorView />
    </Suspense>
  );
}
