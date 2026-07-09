const CUSTOM_BANNER_NAME_PATTERN = /^Custom banner (\d+)$/;

/**
 * Next free auto name for onboarding-created banners: "Custom banner 1",
 * "Custom banner 2", … skipping names already used by the merchant.
 */
export function nextCustomBannerName(existingNames: readonly string[]): string {
  const used = new Set<number>();

  for (const name of existingNames) {
    const match = CUSTOM_BANNER_NAME_PATTERN.exec(name.trim());
    if (!match?.[1]) {
      continue;
    }

    const index = Number.parseInt(match[1], 10);
    if (Number.isFinite(index) && index > 0) {
      used.add(index);
    }
  }

  let n = 1;
  while (used.has(n)) {
    n += 1;
  }

  return `Custom banner ${n}`;
}
