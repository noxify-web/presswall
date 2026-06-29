"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/admin-fetch";
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
  resolveOnboardingDesignConfig,
} from "@/lib/presswall-templates";
import type {
  PresswallConfig,
  PublisherCatalogItem,
  SelectedPublisher,
  ShopPublisherSelection,
} from "@/lib/presswall-types";

export interface PresswallEditor {
  addCustomPublisher: (name: string, svg: string) => void;
  applyTemplate: (templateId: PresswallTemplateId) => void;
  catalog: PublisherCatalogItem[];
  catalogById: Map<string, PublisherCatalogItem>;
  category: string;
  completeOnboarding: () => Promise<boolean>;
  config: PresswallConfig;
  isLoading: boolean;
  isSaving: boolean;
  loadError: boolean;
  matchedTemplateId: PresswallTemplateId | null;
  needsOnboarding: boolean;
  reload: () => Promise<void>;
  removePublisher: (key: string) => void;
  save: () => Promise<void>;
  search: string;
  selected: SelectedPublisher[];
  selectedIds: Set<string>;
  selections: ShopPublisherSelection[];
  setCategory: (value: string) => void;
  setNeedsOnboarding: (value: boolean) => void;
  setSearch: (value: string) => void;
  togglePublisher: (publisher: PublisherCatalogItem) => void;
  unavailableCount: number;
  updateConfig: <K extends keyof PresswallConfig>(
    key: K,
    value: PresswallConfig[K]
  ) => void;
}

export function usePresswallEditor(): PresswallEditor {
  const [catalog, setCatalog] = useState<PublisherCatalogItem[]>([]);
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

  const matchedTemplateId = useMemo(
    () => findMatchingPresswallTemplateId(config),
    [config]
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);

    try {
      const [publishersRes, presswallRes] = await Promise.all([
        adminFetch("/api/publishers"),
        adminFetch("/api/presswall"),
      ]);

      if (!(publishersRes.ok && presswallRes.ok)) {
        setLoadError(true);
        toast.error("Failed to load Presswall settings");
        return;
      }

      const publishersData = await publishersRes.json();
      const presswallData = await presswallRes.json();
      const needsOnboardingFlag = Boolean(presswallData.needsOnboarding);

      setCatalog(publishersData.publishers);
      setConfig(
        needsOnboardingFlag
          ? resolveOnboardingDesignConfig(presswallData.config)
          : presswallData.config
      );
      setSelected(selectedFromApi(presswallData.selections));
      setNeedsOnboarding(needsOnboardingFlag);
    } catch {
      setLoadError(true);
      toast.error("Failed to load Presswall settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const togglePublisher = useCallback((publisher: PublisherCatalogItem) => {
    setSelected((current) => {
      const exists = current.some((item) => item.publisherId === publisher.id);
      if (exists) {
        return current.filter((item) => item.publisherId !== publisher.id);
      }
      return [...current, { key: publisher.id, publisherId: publisher.id }];
    });
  }, []);

  const removePublisher = useCallback((key: string) => {
    setSelected((current) => current.filter((item) => item.key !== key));
  }, []);

  const addCustomPublisher = useCallback((name: string, svg: string) => {
    setSelected((current) => [
      ...current,
      {
        key: `custom-${Date.now()}`,
        customName: name,
        customLogoSvg: svg || undefined,
      },
    ]);
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
            completeOnboarding: options?.completeOnboarding,
          }),
        });

        if (!response.ok) {
          toast.error("Could not save Presswall settings");
          return false;
        }

        if (options?.completeOnboarding) {
          setNeedsOnboarding(false);
        }

        return true;
      } catch {
        toast.error("Could not save Presswall settings");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [config, selections]
  );

  const save = useCallback(async () => {
    const saved = await savePresswall();
    if (saved) {
      toast.success("Presswall saved");
    }
  }, [savePresswall]);

  const completeOnboarding = useCallback(
    () => savePresswall({ completeOnboarding: true }),
    [savePresswall]
  );

  const applyTemplate = useCallback((templateId: PresswallTemplateId) => {
    setConfig(applyPresswallTemplate(templateId));
  }, []);

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
    isLoading,
    isSaving,
    loadError,
    needsOnboarding,
    reload: loadData,
    search,
    selected,
    selectedIds,
    matchedTemplateId,
    selections,
    unavailableCount,
    addCustomPublisher,
    applyTemplate,
    removePublisher,
    save,
    setCategory,
    setNeedsOnboarding,
    setSearch,
    togglePublisher,
    updateConfig,
  };
}
