"use client";

import { useMemo } from "react";
import { EditablePreviewLogo } from "@/components/presswall/editable-preview-logo";
import { PublisherLogo } from "@/components/presswall/publisher-logo";
import { hydrateBannerSelections } from "@/lib/hydrate-banner-selections";
import { getLogoSlotStyle } from "@/lib/presswall-logo-style";
import type {
  PublisherCatalogItem,
  ShopCustomLogo,
  ShopPublisherSelection,
  StorefrontPublisher,
} from "@/lib/presswall-types";
import { resolveStorefrontPublishers } from "@/lib/resolve-storefront-publishers";

interface UsePresswallStripItemsOptions {
  catalog: PublisherCatalogItem[];
  colorMode?: string;
  customLogos?: ShopCustomLogo[];
  logoHeight: number;
  logoMaxWidth: number;
  logoStyle: React.CSSProperties | undefined;
  /** When set, each logo is hover-editable and calls this with the selection index. */
  onReplaceLogoAt?: (selectionIndex: number) => void;
  selections: ShopPublisherSelection[];
}

export function usePresswallStripItems({
  catalog,
  colorMode,
  customLogos,
  logoHeight,
  logoMaxWidth,
  logoStyle,
  onReplaceLogoAt,
  selections,
}: UsePresswallStripItemsOptions) {
  const items = useMemo(() => {
    const hydratedSelections = customLogos?.length
      ? hydrateBannerSelections(selections, customLogos)
      : selections;

    return resolveStorefrontPublishers(catalog, hydratedSelections, {
      customLogos,
      colorMode,
    });
  }, [catalog, colorMode, customLogos, selections]);

  const renderLogo = useMemo(
    () => (item: StorefrontPublisher, selectionIndex: number) => {
      const logo = (
        <PublisherLogo
          customLogoSvg={item.isCustom ? item.logoSvg || undefined : undefined}
          logoImageUrl={item.logoImageUrl}
          name={item.name}
          publisherId={item.isCustom ? undefined : item.id}
          style={getLogoSlotStyle(logoHeight, logoMaxWidth, logoStyle)}
        />
      );

      if (!onReplaceLogoAt) {
        return logo;
      }

      return (
        <EditablePreviewLogo
          label={item.name}
          onReplace={() => onReplaceLogoAt(selectionIndex)}
        >
          {logo}
        </EditablePreviewLogo>
      );
    },
    [logoHeight, logoMaxWidth, logoStyle, onReplaceLogoAt]
  );

  return { items, renderLogo };
}
