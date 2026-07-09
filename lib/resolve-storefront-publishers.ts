import { isBundledPublisherId } from "@/lib/bundled-publishers";
import { type LogoVariant, logoVariantForColorMode } from "@/lib/logo-variant";
import type {
  PublisherCatalogItem,
  ShopCustomLogo,
  ShopPublisherSelection,
  StorefrontPublisher,
} from "@/lib/presswall-types";
import { isSafeHttpUrl } from "@/lib/presswall-validation";
import {
  absoluteBundledLogoUrl,
  bundledLogoPath,
} from "@/lib/publisher-logo-path";
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
  catalog: PublisherCatalogItem[],
  selections: ShopPublisherSelection[],
  options?: {
    absoluteLogoUrls?: boolean;
    colorMode?: string;
    customLogos?: ShopCustomLogo[];
    logoVariant?: LogoVariant;
  }
): StorefrontPublisher[] {
  const catalogById = new Map(catalog.map((item) => [item.id, item]));
  const libraryById = new Map(
    (options?.customLogos ?? []).map((logo) => [logo.id, logo])
  );
  const logoOptions = {
    variant:
      options?.logoVariant ??
      (options?.colorMode
        ? logoVariantForColorMode(options.colorMode)
        : undefined),
    colorMode: options?.colorMode,
  };

  return selections
    .map((selection, index): StorefrontPublisher | null => {
      if (selection.publisherId) {
        const publisher = catalogById.get(selection.publisherId);
        if (!publisher) {
          return null;
        }

        let logoImageUrl: string | null = null;
        if (isBundledPublisherId(publisher.id)) {
          logoImageUrl = options?.absoluteLogoUrls
            ? absoluteBundledLogoUrl(publisher.id, logoOptions)
            : bundledLogoPath(publisher.id, logoOptions);
        }

        return {
          id: publisher.id,
          isCustom: false,
          name: publisher.name,
          logoImageUrl,
          logoSvg: "",
          url: resolvePublisherUrl(selection.customUrl, publisher.websiteUrl),
        };
      }

      const libraryLogo = selection.customLogoId
        ? libraryById.get(selection.customLogoId)
        : undefined;
      const customName = (
        libraryLogo?.name ??
        selection.customName ??
        ""
      ).trim();
      const customLogoSvg =
        libraryLogo?.logoSvg ?? selection.customLogoSvg ?? "";

      if (!customName) {
        return null;
      }

      return {
        id: selection.customLogoId ?? `custom-${index}`,
        isCustom: true,
        name: customName,
        logoImageUrl: null,
        logoSvg: sanitizeSvg(customLogoSvg),
        url: resolvePublisherUrl(selection.customUrl, null),
      };
    })
    .filter(
      (publisher): publisher is StorefrontPublisher => publisher !== null
    );
}
