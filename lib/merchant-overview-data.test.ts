import { describe, expect, test } from "bun:test";
import { merchantOverviewFromEditor } from "@/lib/merchant-overview-data";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import type { PublisherCatalogItem } from "@/lib/presswall-types";
import { createPresswallEditorFixture } from "@/lib/test-fixtures/presswall-editor-fixture";

const FORBES_CATALOG: PublisherCatalogItem[] = [
  {
    id: "forbes",
    name: "Forbes",
    category: "Business",
    logoSvg: "<svg/>",
    logoMonoSvg: "<svg/>",
    websiteUrl: "https://forbes.com",
  },
];

describe("merchantOverviewFromEditor", () => {
  test("projects chosen catalog outlets into dashboard read model", () => {
    const editor = createPresswallEditorFixture({
      catalog: FORBES_CATALOG,
      selected: [{ key: "forbes", publisherId: "forbes" }],
      selections: [{ publisherId: "forbes", position: 0 }],
      config: DEFAULT_PRESSWALL_CONFIG,
      matchedTemplateId: "classic",
      unavailableCount: 0,
    });

    const data = merchantOverviewFromEditor(editor);

    expect(data.selected).toEqual([{ key: "forbes", publisherId: "forbes" }]);
    expect(data.selections).toEqual([{ publisherId: "forbes", position: 0 }]);
    expect(data.catalog).toEqual(FORBES_CATALOG);
    expect(data.customLogos).toEqual([]);
    expect(data.unavailableCount).toBe(0);
  });
});
