import type {
  SelectedPublisher,
  ShopPublisherSelection,
} from "@/lib/presswall-types";

/** Build storage-oriented selections (id references only when possible). */
export function buildSelections(
  selected: SelectedPublisher[]
): ShopPublisherSelection[] {
  return selected.map((item, index) => {
    if (item.customLogoId) {
      return {
        customLogoId: item.customLogoId,
        customUrl: item.customUrl,
        position: index,
      };
    }

    if (item.publisherId) {
      return {
        publisherId: item.publisherId,
        customUrl: item.customUrl,
        position: index,
      };
    }

    // Legacy inline custom outlet
    return {
      customName: item.customName,
      customLogoSvg: item.customLogoSvg,
      customUrl: item.customUrl,
      position: index,
    };
  });
}

export function selectedFromApi(
  selections: ShopPublisherSelection[]
): SelectedPublisher[] {
  return selections.map((selection, index) => ({
    key:
      selection.publisherId ??
      (selection.customLogoId
        ? `custom-${selection.customLogoId}`
        : `custom-${index}`),
    publisherId: selection.publisherId,
    customLogoId: selection.customLogoId,
    customName: selection.customName,
    customLogoSvg: selection.customLogoSvg,
    customUrl: selection.customUrl,
  }));
}

export function selectionsEqual(
  left: ShopPublisherSelection[],
  right: ShopPublisherSelection[]
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((selection, index) => {
    const other = right[index];
    if (!other) {
      return false;
    }

    return (
      selection.publisherId === other.publisherId &&
      selection.customLogoId === other.customLogoId &&
      selection.customName === other.customName &&
      selection.customLogoSvg === other.customLogoSvg &&
      (selection.customUrl || "") === (other.customUrl || "") &&
      selection.position === other.position
    );
  });
}

export function countUnavailableSelections(
  selected: SelectedPublisher[],
  catalogById: Map<string, { id: string }>
): number {
  return selected.filter(
    (item) => item.publisherId && !catalogById.has(item.publisherId)
  ).length;
}
