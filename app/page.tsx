import { AdminDashboard } from "@/components/presswall/admin-dashboard";
import { AppEmptyState } from "@/components/presswall/app-empty-state";
import { authenticatePage } from "@/lib/authenticate-page";
import { hasEmbeddedEntryParams } from "@/lib/embedded-entry";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  if (!hasEmbeddedEntryParams(params)) {
    return (
      <AppEmptyState
        description="Install and open Presswall from your Shopify admin to configure your press logos."
        title="Open from Shopify admin"
      />
    );
  }

  // Auth only — catalog seed + metafield sync happen on API load / save.
  await authenticatePage(searchParams);

  return <AdminDashboard />;
}
