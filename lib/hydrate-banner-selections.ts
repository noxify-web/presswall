import type {
  ShopCustomLogo,
  ShopPublisherSelection,
} from "@/lib/presswall-types";

export function hydrateBannerSelections(
  selections: ShopPublisherSelection[],
  library: ShopCustomLogo[]
): ShopPublisherSelection[] {
  if (library.length === 0) {
    return selections;
  }

  const libraryById = new Map(library.map((logo) => [logo.id, logo]));

  return selections.map((selection) => {
    if (!selection.customLogoId) {
      return selection;
    }

    const libraryLogo = libraryById.get(selection.customLogoId);
    if (!libraryLogo) {
      return selection;
    }

    return {
      ...selection,
      customName: libraryLogo.name,
      customLogoSvg: libraryLogo.logoSvg,
    };
  });
}
