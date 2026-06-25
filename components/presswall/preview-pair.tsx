"use client";

import { PresswallPreview } from "@/components/presswall/preview";
import type {
  PresswallConfig,
  PublisherCatalogItem,
  ShopPublisherSelection,
} from "@/lib/presswall-types";

type PreviewPairProps = {
  config: PresswallConfig;
  catalog: PublisherCatalogItem[];
  selections: ShopPublisherSelection[];
};

const PREVIEW_THEMES = ["light", "dark"] as const;

export function PresswallPreviewPair({
  config,
  catalog,
  selections,
}: PreviewPairProps) {
  return (
    <>
      {PREVIEW_THEMES.map((theme) => (
        <PresswallPreview
          catalog={catalog}
          config={config}
          key={theme}
          selections={selections}
          theme={theme}
        />
      ))}
    </>
  );
}
