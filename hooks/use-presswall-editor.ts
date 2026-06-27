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
import type {
  PresswallConfig,
  PublisherCatalogItem,
  SelectedPublisher,
  ShopPublisherSelection,
} from "@/lib/presswall-types";

function buildSnapshot(
  config: PresswallConfig,
  selected: SelectedPublisher[]
): string {
  return JSON.stringify({ config, selections: buildSelections(selected) });
}

export interface PresswallEditor {
  addCustomPublisher: (name: string, svg: string) => void;
  catalog: PublisherCatalogItem[];
  catalogById: Map<string, PublisherCatalogItem>;
  category: string;
  config: PresswallConfig;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  movePublisher: (index: number, direction: -1 | 1) => void;
  removePublisher: (key: string) => void;
  save: () => Promise<void>;
  search: string;
  selected: SelectedPublisher[];
  selectedIds: Set<string>;
  selections: ShopPublisherSelection[];
  setCategory: (value: string) => void;
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
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [publishersRes, presswallRes] = await Promise.all([
        adminFetch("/api/publishers"),
        adminFetch("/api/presswall"),
      ]);

      if (!(publishersRes.ok && presswallRes.ok)) {
        toast.error("Failed to load Presswall settings");
        return;
      }

      const publishersData = await publishersRes.json();
      const presswallData = await presswallRes.json();

      const loadedSelected = selectedFromApi(presswallData.selections);
      setCatalog(publishersData.publishers);
      setConfig(presswallData.config);
      setSelected(loadedSelected);
      setSavedSnapshot(buildSnapshot(presswallData.config, loadedSelected));
    } catch {
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

  const isDirty = useMemo(() => {
    if (savedSnapshot === null) {
      return false;
    }
    return buildSnapshot(config, selected) !== savedSnapshot;
  }, [config, savedSnapshot, selected]);

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

  const movePublisher = useCallback((index: number, direction: -1 | 1) => {
    setSelected((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) {
        return current;
      }
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
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

  const save = useCallback(async () => {
    setIsSaving(true);

    try {
      const response = await adminFetch("/api/presswall", {
        method: "PUT",
        body: JSON.stringify({
          config,
          selections,
        }),
      });

      if (response.ok) {
        setSavedSnapshot(buildSnapshot(config, selected));
        toast.success("Presswall saved");
        return;
      }

      toast.error("Could not save Presswall settings");
    } catch {
      toast.error("Could not save Presswall settings");
    } finally {
      setIsSaving(false);
    }
  }, [config, selected, selections]);

  const updateConfig = useCallback(
    <K extends keyof PresswallConfig>(key: K, value: PresswallConfig[K]) => {
      setConfig((current) => ({ ...current, [key]: value }));
    },
    []
  );

  return {
    catalog,
    catalogById,
    category,
    config,
    isDirty,
    isLoading,
    isSaving,
    search,
    selected,
    selectedIds,
    selections,
    unavailableCount,
    addCustomPublisher,
    movePublisher,
    removePublisher,
    save,
    setCategory,
    setSearch,
    togglePublisher,
    updateConfig,
  };
}
