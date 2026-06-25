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
import { ensurePublisherCatalogSeeded } from "@/lib/presswall-service";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function AppEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
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

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const shopParam = typeof params.shop === "string" ? params.shop : undefined;

  if (!shopParam) {
    return (
      <AppEmptyState
        description="Install and open Presswall from your Shopify admin to configure your press logos."
        title="Open from Shopify admin"
      />
    );
  }

  await authenticatePage(searchParams);
  await ensurePublisherCatalogSeeded();

  return <AdminDashboard />;
}
