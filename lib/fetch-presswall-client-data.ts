import { adminFetch } from "@/lib/admin-fetch";
import type { ShopBanner } from "@/lib/banner-service";
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
  banners: ShopBanner[];
  catalog: PublisherCatalogItem[];
  config: PresswallConfig;
  customLogos: ShopCustomLogo[];
  needsOnboarding: boolean;
  selected: SelectedPublisher[];
}

export async function fetchPresswallClientData(): Promise<PresswallClientData> {
  const [publishersRes, presswallRes, customLogosRes, bannersRes] =
    await Promise.all([
      adminFetch("/api/publishers"),
      adminFetch("/api/presswall"),
      adminFetch("/api/custom-logos"),
      adminFetch("/api/banners"),
    ]);

  if (!(publishersRes.ok && presswallRes.ok && customLogosRes.ok)) {
    throw new Error("Failed to load Presswall settings");
  }

  const publishersData = await publishersRes.json();
  const presswallData = await presswallRes.json();
  const customLogosData = await customLogosRes.json();
  const needsOnboarding = Boolean(presswallData.needsOnboarding);

  let banners: ShopBanner[] = [];
  if (bannersRes.ok) {
    const bannersData = (await bannersRes.json()) as {
      banners?: ShopBanner[];
      templates?: ShopBanner[];
    };
    banners = bannersData.banners ?? bannersData.templates ?? [];
  }

  const config = needsOnboarding
    ? resolveOnboardingDesignConfig(presswallData.config)
    : presswallData.config;

  return {
    bannerId: presswallData.bannerId ?? null,
    banners,
    catalog: publishersData.publishers,
    config: config ?? DEFAULT_PRESSWALL_CONFIG,
    customLogos: customLogosData.logos ?? [],
    needsOnboarding,
    selected: selectedFromApi(presswallData.selections),
  };
}
