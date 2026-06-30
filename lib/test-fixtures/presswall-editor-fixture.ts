import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";

export function createPresswallEditorFixture(
  overrides: Partial<PresswallEditor> = {}
): PresswallEditor {
  return {
    applyCustomBanner: () => undefined,
    applyTemplate: () => undefined,
    catalog: [],
    customTemplates: [],
    catalogById: new Map(),
    category: "All",
    completeOnboarding: async () => true,
    config: DEFAULT_PRESSWALL_CONFIG,
    customLogos: [],
    deleteCustomLogo: async () => undefined,
    discard: () => undefined,
    isDirty: false,
    isLoading: false,
    isSaving: false,
    loadError: false,
    matchedCustomTemplateId: null,
    matchedTemplateId: "classic",
    needsOnboarding: true,
    refreshCustomTemplates: async () => undefined,
    reload: async () => undefined,
    save: async () => undefined,
    search: "",
    selected: [{ key: "pub-1", publisherId: "pub-1" }],
    selectedIds: new Set(["pub-1"]),
    selections: [{ publisherId: "pub-1", position: 0 }],
    setCategory: () => undefined,
    setNeedsOnboarding: () => undefined,
    setSearch: () => undefined,
    toggleCustomLogo: () => undefined,
    togglePublisher: () => undefined,
    unavailableCount: 0,
    updateConfig: () => undefined,
    uploadCustomLogo: async () => true,
    ...overrides,
  };
}
