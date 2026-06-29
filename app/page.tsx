import { AdminDashboard } from "@/components/presswall/admin-dashboard";
import { BrandLogo } from "@/components/presswall/brand-logo";
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
import { syncStorefrontMetafield } from "@/lib/sync-storefront-metafield";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface AppEmptyStateProps {
  description: string;
  title: string;
}

function AppEmptyState({ title, description }: AppEmptyStateProps) {
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
