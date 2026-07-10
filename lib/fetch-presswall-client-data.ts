import { adminFetch } from "@/lib/admin-fetch";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import { selectedFromApi } from "@/lib/presswall-selections";
import { resolveOnboardingDesignConfig } from "@/lib/presswall-templates";
import type {
  PresswallConfig,
  PublisherCatalogItem,
  SelectedPublisher,
  ShopCustomLogo,
} from "@/lib/presswall-types";

export interface PresswallClientData {
  bannerId: string | null;
  catalog: PublisherCatalogItem[];
  config: PresswallConfig;
  customLogos: ShopCustomLogo[];
  needsOnboarding: boolean;
  selected: SelectedPublisher[];
}

export async function fetchPresswallClientData(): Promise<PresswallClientData> {
  const bootstrapRes = await adminFetch("/api/presswall/bootstrap");

  if (bootstrapRes.ok) {
    const data = await bootstrapRes.json();
    const needsOnboarding = Boolean(data.needsOnboarding);
    const config = needsOnboarding
      ? resolveOnboardingDesignConfig(data.config)
      : data.config;

    return {
      bannerId: data.bannerId ?? null,
      catalog: (data.publishers ?? []) as PublisherCatalogItem[],
      config: config ?? DEFAULT_PRESSWALL_CONFIG,
      customLogos: (data.logos ?? []) as ShopCustomLogo[],
      needsOnboarding,
      selected: selectedFromApi(data.selections),
    };
  }

  // Fallback for older deploys: three parallel requests.
  const [publishersRes, presswallRes, customLogosRes] = await Promise.all([
    adminFetch("/api/publishers"),
    adminFetch("/api/presswall"),
    adminFetch("/api/custom-logos"),
  ]);

  if (!(publishersRes.ok && presswallRes.ok && customLogosRes.ok)) {
    throw new Error("Failed to load Presswall settings");
  }

  const publishersData = await publishersRes.json();
  const presswallData = await presswallRes.json();
  const customLogosData = await customLogosRes.json();
  const needsOnboarding = Boolean(presswallData.needsOnboarding);

  const config = needsOnboarding
    ? resolveOnboardingDesignConfig(presswallData.config)
    : presswallData.config;

  return {
    bannerId: presswallData.bannerId ?? null,
    catalog: publishersData.publishers,
    config: config ?? DEFAULT_PRESSWALL_CONFIG,
    customLogos: customLogosData.logos ?? [],
    needsOnboarding,
    selected: selectedFromApi(presswallData.selections),
  };
}
