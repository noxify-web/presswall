import type {
  PublisherCatalogItem,
  SelectedPublisher,
  ShopCustomLogo,
} from "@/lib/presswall-types";

function dedupeSelections(
  selected: readonly SelectedPublisher[]
): SelectedPublisher[] {
  return selected.filter((item, index, list) => {
    if (item.publisherId) {
      return (
        list.findIndex((entry) => entry.publisherId === item.publisherId) ===
        index
      );
    }

    if (item.customLogoId) {
      return (
        list.findIndex((entry) => entry.customLogoId === item.customLogoId) ===
        index
      );
    }

    return true;
  });
}

/** Replace the outlet at `index` with a bundled publisher (dedupe other slots). */
export function replaceSelectionWithPublisher(
  selected: readonly SelectedPublisher[],
  index: number,
  publisher: PublisherCatalogItem
): SelectedPublisher[] {
  if (index < 0 || index >= selected.length) {
    return [...selected];
  }

  const replacement: SelectedPublisher = {
    key: publisher.id,
    publisherId: publisher.id,
  };

  return dedupeSelections(
    selected.map((item, i) => (i === index ? replacement : item))
  );
}

/** Replace the outlet at `index` with a custom uploaded logo (dedupe other slots). */
export function replaceSelectionWithCustomLogo(
  selected: readonly SelectedPublisher[],
  index: number,
  logo: ShopCustomLogo
): SelectedPublisher[] {
  if (index < 0 || index >= selected.length) {
    return [...selected];
  }

  const replacement: SelectedPublisher = {
    key: `custom-${logo.id}`,
    customLogoId: logo.id,
    customName: logo.name,
    customLogoSvg: logo.logoSvg,
  };

  return dedupeSelections(
    selected.map((item, i) => (i === index ? replacement : item))
  );
}
