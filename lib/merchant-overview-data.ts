import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import type {
  PresswallConfig,
  PublisherCatalogItem,
  SelectedPublisher,
  ShopCustomLogo,
  ShopPublisherSelection,
} from "@/lib/presswall-types";

export interface MerchantOverviewData {
  catalog: PublisherCatalogItem[];
  config: PresswallConfig;
  customLogos: ShopCustomLogo[];
  selected: SelectedPublisher[];
  selections: ShopPublisherSelection[];
  unavailableCount: number;
}

export function merchantOverviewFromEditor(
  editor: PresswallEditor
): MerchantOverviewData {
  return {
    catalog: editor.catalog,
    config: editor.config,
    customLogos: editor.customLogos,
    selected: editor.selected,
    selections: editor.selections,
    unavailableCount: editor.unavailableCount,
  };
}
