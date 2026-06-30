"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/admin-fetch";
import { createPendingCustomLogoId } from "@/lib/custom-logo-pending";
import type { ShopCustomTemplate } from "@/lib/custom-template-service";
import { fetchPresswallClientData } from "@/lib/fetch-presswall-client-data";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import {
  buildSelections,
  countUnavailableSelections,
  selectedFromApi,
} from "@/lib/presswall-selections";
import { applyDerivedSpacingPatch } from "@/lib/presswall-spacing";
import {
  applyPresswallTemplate,
  findMatchingPresswallTemplateId,
  type PresswallTemplateId,
  presswallConfigsEqual,
} from "@/lib/presswall-templates";
import type {
  PresswallConfig,
  PublisherCatalogItem,
  SelectedPublisher,
  ShopCustomLogo,
  ShopPublisherSelection,
} from "@/lib/presswall-types";

export interface PresswallEditor {
  applyCustomBanner: (templateId: string) => void;
  applyTemplate: (templateId: PresswallTemplateId) => void;
  catalog: PublisherCatalogItem[];
  catalogById: Map<string, PublisherCatalogItem>;
  category: string;
  completeOnboarding: () => Promise<boolean>;
  config: PresswallConfig;
  customLogos: ShopCustomLogo[];
  customTemplates: ShopCustomTemplate[];
  deleteCustomLogo: (logoId: string) => Promise<void>;
  discard: () => void;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: boolean;
  matchedCustomTemplateId: string | null;
  matchedTemplateId: PresswallTemplateId | null;
  needsOnboarding: boolean;
  refreshCustomTemplates: () => Promise<void>;
  reload: () => Promise<void>;
  save: () => Promise<void>;
  search: string;
  selected: SelectedPublisher[];
  selectedIds: Set<string>;
  selections: ShopPublisherSelection[];
  setCategory: (value: string) => void;
  setNeedsOnboarding: (value: boolean) => void;
  setSearch: (value: string) => void;
  toggleCustomLogo: (logo: ShopCustomLogo) => void;
  togglePublisher: (publisher: PublisherCatalogItem) => void;
  unavailableCount: number;
  updateConfig: <K extends keyof PresswallConfig>(
    key: K,
    value: PresswallConfig[K]
  ) => void;
  uploadCustomLogo: (name: string, svg: string) => Promise<boolean>;
}

function customLogosEqual(
  left: ShopCustomLogo[],
  right: ShopCustomLogo[]
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function usePresswallEditor(): PresswallEditor {
  const [catalog, setCatalog] = useState<PublisherCatalogItem[]>([]);
  const [customLogos, setCustomLogos] = useState<ShopCustomLogo[]>([]);
  const [config, setConfig] = useState<PresswallConfig>(
    DEFAULT_PRESSWALL_CONFIG
  );
  const [selected, setSelected] = useState<SelectedPublisher[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(true);
  const [customTemplates, setCustomTemplates] = useState<ShopCustomTemplate[]>(
    []
  );
  const [activeCustomTemplateId, setActiveCustomTemplateId] = useState<
    string | null
  >(null);
  const [savedSnapshot, setSavedSnapshot] = useState<{
    config: PresswallConfig;
    customLogos: ShopCustomLogo[];
    selected: SelectedPublisher[];
  } | null>(null);

  const matchedTemplateId = useMemo(() => {
    if (activeCustomTemplateId) {
      return null;
    }

    return findMatchingPresswallTemplateId(config);
  }, [activeCustomTemplateId, config]);

  const matchedCustomTemplateId = activeCustomTemplateId;

  const loadCustomTemplates = useCallback(async () => {
    try {
      const response = await adminFetch("/api/custom-templates");
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        templates?: ShopCustomTemplate[];
      };

      setCustomTemplates(data.templates ?? []);
    } catch {
      // Non-blocking for the main editor flow.
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);

    try {
      const data = await fetchPresswallClientData();

      setCatalog(data.catalog);
      setCustomLogos(data.customLogos);
      setConfig(data.config);
      setSelected(data.selected);
      setSavedSnapshot({
        config: data.config,
        customLogos: data.customLogos,
        selected: data.selected,
      });
      setNeedsOnboarding(data.needsOnboarding);
      setActiveCustomTemplateId(null);
      await loadCustomTemplates();
    } catch {
      setLoadError(true);
      toast.error("Failed to load Presswall settings");
    } finally {
      setIsLoading(false);
    }
  }, [loadCustomTemplates]);

  useEffect(() => {
    loadData().catch(() => {
      toast.error("Failed to load Presswall settings");
    });
  }, [loadData]);

  const selectedIds = useMemo(
    () =>
      new Set(
        selected
          .map((item) => item.publisherId)
          .filter((id): id is string => Boolean(id))
      ),
    [selected]
  );

  const catalogById = useMemo(
    () => new Map(catalog.map((item) => [item.id, item])),
    [catalog]
  );

  const selections = useMemo(() => buildSelections(selected), [selected]);

  const unavailableCount = useMemo(
    () => countUnavailableSelections(selected, catalogById),
    [selected, catalogById]
  );

  const isDirty = useMemo(() => {
    if (!savedSnapshot) {
      return false;
    }

    if (!presswallConfigsEqual(config, savedSnapshot.config)) {
      return true;
    }

    if (!customLogosEqual(customLogos, savedSnapshot.customLogos)) {
      return true;
    }

    return (
      JSON.stringify(buildSelections(selected)) !==
      JSON.stringify(buildSelections(savedSnapshot.selected))
    );
  }, [config, customLogos, savedSnapshot, selected]);

  const togglePublisher = useCallback((publisher: PublisherCatalogItem) => {
    setSelected((current) => {
      const exists = current.some((item) => item.publisherId === publisher.id);
      if (exists) {
        return current.filter((item) => item.publisherId !== publisher.id);
      }
      return [...current, { key: publisher.id, publisherId: publisher.id }];
    });
  }, []);

  const toggleCustomLogo = useCallback((logo: ShopCustomLogo) => {
    setSelected((current) => {
      const exists = current.some((item) => item.customLogoId === logo.id);
      if (exists) {
        return current.filter((item) => item.customLogoId !== logo.id);
      }

      return [
        ...current,
        {
          key: `custom-${logo.id}`,
          customLogoId: logo.id,
          customName: logo.name,
          customLogoSvg: logo.logoSvg,
        },
      ];
    });
  }, []);

  const uploadCustomLogo = useCallback((name: string, svg: string) => {
    const trimmedName = name.trim();
    if (!(trimmedName && svg.trim())) {
      toast.error("Could not save custom logo");
      return Promise.resolve(false);
    }

    const logo: ShopCustomLogo = {
      id: createPendingCustomLogoId(),
      name: trimmedName,
      logoSvg: svg,
      createdAt: new Date().toISOString(),
    };

    setCustomLogos((current) => [...current, logo]);
    setSelected((current) => [
      ...current,
      {
        key: `custom-${logo.id}`,
        customLogoId: logo.id,
        customName: logo.name,
        customLogoSvg: logo.logoSvg,
      },
    ]);

    return Promise.resolve(true);
  }, []);

  const deleteCustomLogo = useCallback((logoId: string) => {
    setCustomLogos((current) => current.filter((logo) => logo.id !== logoId));
    setSelected((current) =>
      current.filter((item) => item.customLogoId !== logoId)
    );
    return Promise.resolve();
  }, []);

  const savePresswall = useCallback(
    async (options?: { completeOnboarding?: boolean }) => {
      setIsSaving(true);

      try {
        const response = await adminFetch("/api/presswall", {
          method: "PUT",
          body: JSON.stringify({
            config,
            selections,
            customLogos,
            completeOnboarding: options?.completeOnboarding,
          }),
        });

        if (!response.ok) {
          toast.error("Could not save Presswall settings");
          return false;
        }

        const data = (await response.json()) as {
          customLogos?: ShopCustomLogo[];
          selections?: ShopPublisherSelection[];
        };

        const nextCustomLogos = data.customLogos ?? customLogos;
        const nextSelected = data.selections
          ? selectedFromApi(data.selections)
          : selected;

        if (options?.completeOnboarding) {
          setNeedsOnboarding(false);
        }

        setCustomLogos(nextCustomLogos);
        setSelected(nextSelected);
        setSavedSnapshot({
          config,
          customLogos: nextCustomLogos.map((logo) => ({ ...logo })),
          selected: nextSelected.map((item) => ({ ...item })),
        });

        return true;
      } catch {
        toast.error("Could not save Presswall settings");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [config, customLogos, selections, selected]
  );

  const save = useCallback(async () => {
    const saved = await savePresswall();
    if (saved) {
      toast.success("Presswall saved");
    }
  }, [savePresswall]);

  const discard = useCallback(() => {
    if (!savedSnapshot) {
      return;
    }

    setConfig(savedSnapshot.config);
    setCustomLogos(savedSnapshot.customLogos.map((logo) => ({ ...logo })));
    setSelected(savedSnapshot.selected.map((item) => ({ ...item })));
    toast.success("Changes discarded");
  }, [savedSnapshot]);

  const completeOnboarding = useCallback(
    () => savePresswall({ completeOnboarding: true }),
    [savePresswall]
  );

  const applyTemplate = useCallback((templateId: PresswallTemplateId) => {
    setActiveCustomTemplateId(null);
    setConfig(applyPresswallTemplate(templateId));
  }, []);

  const applyCustomBanner = useCallback(
    (templateId: string) => {
      const template = customTemplates.find((entry) => entry.id === templateId);
      if (!template) {
        toast.error("Saved banner not found");
        return;
      }

      setActiveCustomTemplateId(template.id);
      setConfig(template.config);
      setSelected(selectedFromApi(template.selections));
    },
    [customTemplates]
  );

  const updateConfig = useCallback(
    <K extends keyof PresswallConfig>(key: K, value: PresswallConfig[K]) => {
      setConfig((current) => {
        const next = { ...current, [key]: value };

        return {
          ...next,
          ...applyDerivedSpacingPatch(next, key),
        };
      });
    },
    []
  );

  return {
    catalog,
    catalogById,
    category,
    completeOnboarding,
    config,
    customLogos,
    customTemplates,
    discard,
    isDirty,
    isLoading,
    isSaving,
    loadError,
    needsOnboarding,
    reload: loadData,
    refreshCustomTemplates: loadCustomTemplates,
    search,
    selected,
    selectedIds,
    matchedCustomTemplateId,
    matchedTemplateId,
    selections,
    unavailableCount,
    applyCustomBanner,
    applyTemplate,
    deleteCustomLogo,
    save,
    setCategory,
    setNeedsOnboarding,
    setSearch,
    toggleCustomLogo,
    togglePublisher,
    updateConfig,
    uploadCustomLogo,
  };
}
