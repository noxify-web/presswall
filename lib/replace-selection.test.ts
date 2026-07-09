import { describe, expect, test } from "bun:test";
import type {
  PublisherCatalogItem,
  SelectedPublisher,
  ShopCustomLogo,
} from "@/lib/presswall-types";
import {
  replaceSelectionWithCustomLogo,
  replaceSelectionWithPublisher,
} from "@/lib/replace-selection";

const forbes: PublisherCatalogItem = {
  id: "forbes",
  name: "Forbes",
  category: "Business",
  logoSvg: "<svg/>",
  logoMonoSvg: "<svg/>",
  websiteUrl: null,
};

const wired: PublisherCatalogItem = {
  id: "wired",
  name: "WIRED",
  category: "Tech",
  logoSvg: "<svg/>",
  logoMonoSvg: "<svg/>",
  websiteUrl: null,
};

const custom: ShopCustomLogo = {
  id: "logo-1",
  name: "Local Mag",
  logoSvg: "<svg/>",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("replaceSelectionWithPublisher", () => {
  test("replaces the outlet at the given index", () => {
    const selected: SelectedPublisher[] = [
      { key: "forbes", publisherId: "forbes" },
      { key: "cnbc", publisherId: "cnbc" },
    ];

    expect(replaceSelectionWithPublisher(selected, 1, wired)).toEqual([
      { key: "forbes", publisherId: "forbes" },
      { key: "wired", publisherId: "wired" },
    ]);
  });

  test("dedupes when the replacement already exists elsewhere", () => {
    const selected: SelectedPublisher[] = [
      { key: "forbes", publisherId: "forbes" },
      { key: "wired", publisherId: "wired" },
      { key: "cnbc", publisherId: "cnbc" },
    ];

    // Replace cnbc with forbes → only one forbes remains at index 2 after map,
    // then first forbes is dropped by dedupe keeping first occurrence...
    // After map: [forbes, wired, forbes] → filter keeps first forbes only → [forbes, wired]
    // Wait: findIndex keeps first of each publisherId. So [forbes, wired, forbes]
    // index 0 kept, 1 kept, 2 dropped → [forbes, wired]. Good - cnbc gone, forbes not duplicated.
    expect(replaceSelectionWithPublisher(selected, 2, forbes)).toEqual([
      { key: "forbes", publisherId: "forbes" },
      { key: "wired", publisherId: "wired" },
    ]);
  });

  test("no-ops for out-of-range index", () => {
    const selected: SelectedPublisher[] = [
      { key: "forbes", publisherId: "forbes" },
    ];
    expect(replaceSelectionWithPublisher(selected, 3, wired)).toEqual(selected);
  });
});

describe("replaceSelectionWithCustomLogo", () => {
  test("replaces a bundled outlet with a custom logo", () => {
    const selected: SelectedPublisher[] = [
      { key: "forbes", publisherId: "forbes" },
    ];

    expect(replaceSelectionWithCustomLogo(selected, 0, custom)).toEqual([
      {
        key: "custom-logo-1",
        customLogoId: "logo-1",
        customName: "Local Mag",
        customLogoSvg: "<svg/>",
      },
    ]);
  });
});
