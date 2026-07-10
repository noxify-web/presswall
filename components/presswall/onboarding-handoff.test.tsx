import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import type {
  PublisherCatalogItem,
  ShopPublisherSelection,
} from "@/lib/presswall-types";

const CATALOG_FIXTURE: PublisherCatalogItem[] = [
  {
    id: "forbes",
    name: "Forbes",
    category: "Business",
    logoSvg: "<svg/>",
    logoMonoSvg: "<svg/>",
    websiteUrl: "https://forbes.com",
  },
];

const STEP_TWO_LABEL = /Step 2 of 3 — Design your press strip/;

mock.module("@/components/presswall/onboarding-preview-canvas", () => ({
  OnboardingPreviewCanvas: () => (
    <div data-testid="read-only-preview">Preview</div>
  ),
}));

mock.module("@/components/presswall/onboarding-preview", () => ({
  OnboardingPreview: () => <div data-testid="template-preview">Preview</div>,
}));

let savedSelections: ShopPublisherSelection[] | undefined;

function setupHandoffMocks() {
  savedSelections = undefined;

  mock.module("@/lib/fetch-presswall-client-data", () => ({
    fetchPresswallClientData: () =>
      Promise.resolve({
        bannerId: null,
        catalog: CATALOG_FIXTURE,
        config: DEFAULT_PRESSWALL_CONFIG,
        customLogos: [],
        needsOnboarding: true,
        selected: [],
      }),
  }));

  mock.module("@/lib/admin-fetch", () => ({
    adminFetch: (path: string, init?: RequestInit) => {
      if (path === "/api/theme-activation") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              activateEmbedUrl: "https://example.com/theme",
              activateSectionUrl: "https://example.com/section",
              appBlockEnabled: false,
              appEmbedEnabled: true,
              isActive: true,
              themeId: "gid://shopify/Theme/1",
              themeName: "Dawn",
            }),
        });
      }

      if (path === "/api/custom-logos") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ logos: [] }),
        });
      }

      if (path === "/api/presswall" && init?.method === "PUT") {
        const body = JSON.parse(String(init.body)) as {
          selections: ShopPublisherSelection[];
        };
        savedSelections = body.selections;

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }

      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      });
    },
    captureIdTokenFromUrl: () => undefined,
    stripStaleIdTokenFromUrl: () => undefined,
    getSessionToken: () => Promise.resolve("test-token"),
    redirectToSessionBounce: () => undefined,
  }));
}

describe("onboarding completion handoff", () => {
  afterEach(() => {
    cleanup();
    mock.restore();
  });

  beforeEach(() => {
    mock.restore();
    setupHandoffMocks();
  });

  test("finishing onboarding shows merchant dashboard with outlets chosen in step 1", async () => {
    const [{ usePresswallEditor }, { AdminDashboardView }] = await Promise.all([
      import("@/hooks/use-presswall-editor"),
      import("./admin-dashboard"),
    ]);

    function HandoffHarness() {
      const editor = usePresswallEditor();
      return <AdminDashboardView editor={editor} />;
    }

    const view = render(<HandoffHarness />);

    await waitFor(() => {
      expect(
        view.getByText("Choose which press logos to show on your store")
      ).toBeTruthy();
    });

    fireEvent.click(view.getByRole("button", { name: "Forbes" }));
    fireEvent.click(view.getByRole("button", { name: "Continue with 1 logo" }));

    await waitFor(() => {
      expect(view.getByText(STEP_TWO_LABEL)).toBeTruthy();
    });

    fireEvent.click(view.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(
        view.getByText("Step 3 of 3 — Go live on your store")
      ).toBeTruthy();
    });

    await waitFor(() => {
      expect(view.getByText("Presswall is active")).toBeTruthy();
    });

    fireEvent.click(view.getByRole("button", { name: "Open editor" }));

    await waitFor(() => {
      expect(savedSelections).toEqual([{ publisherId: "forbes", position: 0 }]);
      expect(view.getByText("Storefront preview")).toBeTruthy();
      expect(view.getByText("Storefront embed")).toBeTruthy();
      expect(view.getByText("Add to your theme")).toBeTruthy();
      expect(view.getByRole("button", { name: "Open editor" })).toBeTruthy();
      expect(
        view.queryByText("Choose which press logos to show on your store")
      ).toBeNull();
      expect(view.queryByText("Discard")).toBeNull();
    });
  });
});
