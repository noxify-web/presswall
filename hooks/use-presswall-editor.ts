"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/admin-fetch";
import type { ShopBanner } from "@/lib/banner-service";
import { nextCustomBannerName } from "@/lib/custom-banner-name";
import { createPendingCustomLogoId } from "@/lib/custom-logo-pending";
import { fetchPresswallClientData } from "@/lib/fetch-presswall-client-data";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import {
  buildSelections,
  countUnavailableSelections,
  selectedFromApi,
  selectionsEqual,
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
import {
  replaceSelectionWithCustomLogo,
  replaceSelectionWithPublisher,
} from "@/lib/replace-selection";

export interface PresswallEditor {
  activeBannerId: string | null;
  applyCustomBanner: (bannerId: string) => void;
  applyTemplate: (templateId: PresswallTemplateId) => void;
  banners: ShopBanner[];
  catalog: PublisherCatalogItem[];
  catalogById: Map<string, PublisherCatalogItem>;
  category: string;
  completeOnboarding: () => Promise<boolean>;
  config: PresswallConfig;
  /**
   * Add a custom logo to the shop library only (does not change strip selection).
   * Used by the replace-logo dialog upload flow.
   */
  createCustomLogo: (
    name: string,
    svg: string
  ) => Promise<ShopCustomLogo | null>;
  /**
   * Silently create a merchant banner named `Custom banner N` from the current
   * config + selections (onboarding step 2 only). Returns the created banner
   * name, or null if create was skipped/failed.
   */
  createOnboardingCustomBanner: () => Promise<string | null>;
  customLogos: ShopCustomLogo[];
  /** @deprecated Use banners */
  customTemplates: ShopBanner[];
  deleteCustomLogo: (logoId: string) => Promise<void>;
  discard: () => void;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: boolean;
  matchedCustomTemplateId: string | null;
  matchedTemplateId: PresswallTemplateId | null;
  needsOnboarding: boolean;
  refreshBanners: () => Promise<void>;
  /** @deprecated Use refreshBanners */
  refreshCustomTemplates: () => Promise<void>;
  reload: () => Promise<void>;
  /** Replace the logo at a selection index (live preview change control). */
  replaceCustomLogoAt: (index: number, logo: ShopCustomLogo) => void;
  replacePublisherAt: (index: number, publisher: PublisherCatalogItem) => void;
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
  if (left.length !== right.length) {
    return false;
  }

  return left.every((logo, index) => {
    const other = right[index];
    return (
      other &&
      logo.id === other.id &&
      logo.name === other.name &&
      logo.logoSvg === other.logoSvg
    );
  });
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
  const [banners, setBanners] = useState<ShopBanner[]>([]);
  const [activeBannerId, setActiveBannerId] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<{
    activeBannerId: string | null;
    config: PresswallConfig;
    customLogos: ShopCustomLogo[];
    selected: SelectedPublisher[];
  } | null>(null);

  const matchedTemplateId = useMemo(
    () => findMatchingPresswallTemplateId(config),
    [config]
  );

  /** Highlight a saved banner only while the editor still matches it. */
  const matchedCustomTemplateId = useMemo(() => {
    if (!activeBannerId) {
      return null;
    }

    const banner = banners.find((entry) => entry.id === activeBannerId);
    if (!banner) {
      return activeBannerId;
    }

    if (!presswallConfigsEqual(config, banner.config)) {
      return null;
    }

    return selectionsEqual(buildSelections(selected), banner.selections)
      ? activeBannerId
      : null;
  }, [activeBannerId, banners, config, selected]);

  const loadBanners = useCallback(async () => {
    try {
      const response = await adminFetch("/api/banners");
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        banners?: ShopBanner[];
        templates?: ShopBanner[];
      };

      setBanners(data.banners ?? data.templates ?? []);
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
      setBanners(data.banners ?? []);
      setActiveBannerId(data.bannerId ?? null);
      setSavedSnapshot({
        activeBannerId: data.bannerId,
        config: data.config,
        customLogos: data.customLogos,
        selected: data.selected,
      });
      setNeedsOnboarding(data.needsOnboarding);
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

  const isDirty = useMemo(() => {
    if (!savedSnapshot) {
      return false;
    }

    if (activeBannerId !== savedSnapshot.activeBannerId) {
      return true;
    }

    if (!presswallConfigsEqual(config, savedSnapshot.config)) {
      return true;
    }

    if (!customLogosEqual(customLogos, savedSnapshot.customLogos)) {
      return true;
    }

    return !selectionsEqual(
      buildSelections(selected),
      buildSelections(savedSnapshot.selected)
    );
  }, [activeBannerId, config, customLogos, savedSnapshot, selected]);

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

  const replacePublisherAt = useCallback(
    (index: number, publisher: PublisherCatalogItem) => {
      setSelected((current) =>
        replaceSelectionWithPublisher(current, index, publisher)
      );
    },
    []
  );

  const replaceCustomLogoAt = useCallback(
    (index: number, logo: ShopCustomLogo) => {
      setSelected((current) =>
        replaceSelectionWithCustomLogo(current, index, logo)
      );
    },
    []
  );

  const createCustomLogo = useCallback((name: string, svg: string) => {
    const trimmedName = name.trim();
    if (!(trimmedName && svg.trim())) {
      toast.error("Could not save custom logo");
      return Promise.resolve(null);
    }

    const logo: ShopCustomLogo = {
      id: createPendingCustomLogoId(),
      name: trimmedName,
      logoSvg: svg,
      createdAt: new Date().toISOString(),
    };

    setCustomLogos((current) => [...current, logo]);
    return Promise.resolve(logo);
  }, []);

  const uploadCustomLogo = useCallback(
    async (name: string, svg: string) => {
      const logo = await createCustomLogo(name, svg);
      if (!logo) {
        return false;
      }

      setSelected((current) => [
        ...current,
        {
          key: `custom-${logo.id}`,
          customLogoId: logo.id,
          customName: logo.name,
          customLogoSvg: logo.logoSvg,
        },
      ]);

      return true;
    },
    [createCustomLogo]
  );

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
            bannerId: activeBannerId,
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
          bannerId?: string | null;
          customLogos?: ShopCustomLogo[];
          selections?: ShopPublisherSelection[];
        };

        const nextCustomLogos = data.customLogos ?? customLogos;
        const nextSelected = data.selections
          ? selectedFromApi(data.selections)
          : selected;
        const nextBannerId = data.bannerId ?? activeBannerId;

        if (options?.completeOnboarding) {
          setNeedsOnboarding(false);
        }

        setCustomLogos(nextCustomLogos);
        setSelected(nextSelected);
        setActiveBannerId(nextBannerId);
        setSavedSnapshot({
          activeBannerId: nextBannerId,
          config,
          customLogos: nextCustomLogos.map((logo) => ({ ...logo })),
          selected: nextSelected.map((item) => ({ ...item })),
        });

        await loadBanners();

        return true;
      } catch {
        toast.error("Could not save Presswall settings");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [activeBannerId, config, customLogos, loadBanners, selections, selected]
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

    setActiveBannerId(savedSnapshot.activeBannerId);
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
    // Built-in presets edit the current active banner (or default on next save).
    setConfig(applyPresswallTemplate(templateId));
  }, []);

  const applyCustomBanner = useCallback(
    (bannerId: string) => {
      const banner = banners.find((entry) => entry.id === bannerId);
      if (!banner) {
        toast.error("Saved banner not found");
        return;
      }

      setActiveBannerId(banner.id);
      setConfig(banner.config);
      setSelected(selectedFromApi(banner.selections));
    },
    [banners]
  );

  const createOnboardingCustomBanner = useCallback(async () => {
    const name = nextCustomBannerName(banners.map((banner) => banner.name));

    try {
      const response = await adminFetch("/api/banners", {
        method: "POST",
        body: JSON.stringify({
          name,
          config,
          selections,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        banner?: ShopBanner;
        template?: ShopBanner;
      };
      const banner = data.banner ?? data.template;
      if (!banner) {
        return null;
      }

      setBanners((current) => {
        if (current.some((entry) => entry.id === banner.id)) {
          return current;
        }
        return [...current, banner].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });
      setActiveBannerId(banner.id);

      return banner.name;
    } catch {
      return null;
    }
  }, [banners, config, selections]);

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
    activeBannerId,
    catalog,
    catalogById,
    category,
    completeOnboarding,
    config,
    createCustomLogo,
    createOnboardingCustomBanner,
    customLogos,
    banners,
    customTemplates: banners,
    discard,
    isDirty,
    isLoading,
    isSaving,
    loadError,
    needsOnboarding,
    reload: loadData,
    refreshBanners: loadBanners,
    refreshCustomTemplates: loadBanners,
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
    replaceCustomLogoAt,
    replacePublisherAt,
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
