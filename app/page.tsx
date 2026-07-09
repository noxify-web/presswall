import { AdminDashboard } from "@/components/presswall/admin-dashboard";
import { AppEmptyState } from "@/components/presswall/app-empty-state";
import { authenticatePage } from "@/lib/authenticate-page";
import { hasEmbeddedEntryParams } from "@/lib/embedded-entry";
import { ensurePublisherCatalogSeeded } from "@/lib/presswall-service";
import { syncStorefrontMetafield } from "@/lib/sync-storefront-metafield";

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

  const { session } = await authenticatePage(searchParams);
  await ensurePublisherCatalogSeeded();

  if (session.accessToken) {
    syncStorefrontMetafield(session.shop, session.accessToken).then(
      (result) => {
        if (!result.ok) {
          console.error(
            "Presswall storefront metafield sync failed",
            result.error
          );
        }
      }
    );
  }

  return <AdminDashboard />;
}
