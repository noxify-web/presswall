import type {
  PresswallConfig,
  PublisherCatalogItem,
  ShopPublisherSelection,
  StorefrontPublisher,
} from "@/lib/presswall-types";
import { isSafeHttpUrl } from "@/lib/presswall-validation";
import { sanitizeSvg } from "@/lib/svg-sanitize";

function resolvePublisherUrl(
  customUrl: string | undefined,
  fallbackUrl: string | null
): string | null {
  const candidate = customUrl || fallbackUrl;
  if (!candidate) {
    return null;
  }

  return isSafeHttpUrl(candidate) ? candidate : null;
}

export function resolveStorefrontPublishers(
  config: PresswallConfig,
  catalog: PublisherCatalogItem[],
  selections: ShopPublisherSelection[]
): StorefrontPublisher[] {
  const catalogById = new Map(catalog.map((item) => [item.id, item]));

  return selections
    .map((selection, index) => {
      if (selection.publisherId) {
        const publisher = catalogById.get(selection.publisherId);
        if (!publisher) {
          return null;
        }

        const logoSvg =
          config.colorMode === "color"
            ? publisher.logoSvg
            : publisher.logoMonoSvg;

        return {
          id: publisher.id,
          name: publisher.name,
          logoSvg: sanitizeSvg(logoSvg),
          url: resolvePublisherUrl(selection.customUrl, publisher.websiteUrl),
        } satisfies StorefrontPublisher;
      }

      if (!selection.customName?.trim()) {
        return null;
      }

      return {
        id: `custom-${index}`,
        name: selection.customName.trim(),
        logoSvg: sanitizeSvg(selection.customLogoSvg ?? ""),
        url: resolvePublisherUrl(selection.customUrl, null),
      } satisfies StorefrontPublisher;
    })
    .filter(
      (publisher): publisher is StorefrontPublisher => publisher !== null
    );
}
