import { BrandLogo } from "@/components/presswall/brand-logo";
import { EditorView } from "@/components/presswall/editor-view";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { authenticatePage } from "@/lib/authenticate-page";
import { hasEmbeddedEntryParams } from "@/lib/embedded-entry";
import { ensurePublisherCatalogSeeded } from "@/lib/presswall-service";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function AppEmptyState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Empty className="max-w-md border">
        <EmptyHeader>
          <EmptyMedia>
            <BrandLogo size={56} />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
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
  await ensurePublisherCatalogSeeded();

  return <EditorView />;
}
