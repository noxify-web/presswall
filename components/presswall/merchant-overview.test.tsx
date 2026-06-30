import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { ThemeActivationProvider } from "@/components/presswall/theme-activation-provider";
import type { MerchantOverviewData } from "@/lib/merchant-overview-data";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";

mock.module("@/components/presswall/onboarding-preview-canvas", () => ({
  OnboardingPreviewCanvas: () => (
    <div data-testid="read-only-preview">Preview</div>
  ),
}));

mock.module("@/hooks/use-theme-activation-status", () => ({
  useThemeActivationStatus: () => ({
    dismiss: () => undefined,
    isDismissed: false,
    isLoading: false,
    reload: async () => undefined,
    status: {
      activateEmbedUrl: "https://example.com/embed",
      activateSectionUrl:
        "https://example.com/editor?template=product&addAppBlockId=app/presswall",
      appBlockEnabled: false,
      appEmbedEnabled: true,
      isActive: true,
      themeId: "gid://shopify/Theme/1",
      themeName: "Dawn",
    },
  }),
}));

const dataFixture: MerchantOverviewData = {
  catalog: [],
  config: DEFAULT_PRESSWALL_CONFIG,
  customLogos: [],
  selected: [{ key: "1", publisherId: "pub-1" }],
  selections: [{ publisherId: "pub-1", position: 0 }],
  unavailableCount: 0,
};

const { MerchantOverview } = await import("./merchant-overview");

function renderOverview() {
  return render(
    <ThemeActivationProvider>
      <MerchantOverview data={dataFixture} />
    </ThemeActivationProvider>
  );
}

describe("MerchantOverview render", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders preview shell with bottom embed and placement cards", () => {
    const view = renderOverview();

    expect(view.getByText("Storefront preview")).toBeTruthy();
    expect(view.getByRole("button", { name: "Open editor" })).toBeTruthy();
    expect(view.getByTestId("read-only-preview")).toBeTruthy();
    expect(view.getByText("Storefront embed")).toBeTruthy();
    expect(view.getByText("Add to your theme")).toBeTruthy();
    expect(view.getByRole("button", { name: "Add to homepage" })).toBeTruthy();
    expect(
      view.getByRole("button", { name: "Add to product page" })
    ).toBeTruthy();
    expect(view.queryByText("Quick actions")).toBeNull();
    expect(view.queryByText("Tips")).toBeNull();
  });
});
