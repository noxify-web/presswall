import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, waitFor } from "@testing-library/react";
import type { ShopBanner } from "@/lib/banner-service";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import type { PublisherCatalogItem } from "@/lib/presswall-types";
import { createPresswallEditorFixture } from "@/lib/test-fixtures/presswall-editor-fixture";

mock.module("@/components/presswall/onboarding-preview-canvas", () => ({
  OnboardingPreviewCanvas: () => (
    <div data-testid="live-preview">Live preview</div>
  ),
}));

mock.module("@/components/presswall/onboarding-preview", () => ({
  OnboardingPreview: () => <div data-testid="template-preview">Preview</div>,
}));

const CATALOG: PublisherCatalogItem[] = [
  {
    id: "forbes",
    name: "Forbes",
    category: "Business",
    logoSvg: "<svg/>",
    logoMonoSvg: "<svg/>",
    websiteUrl: "https://forbes.com",
  },
];

const SAVE_TEMPLATE_BUTTON = /Save template/i;
const SAVED_AS_LABEL = /Saved as/i;

function makeBanner(overrides: Partial<ShopBanner> = {}): ShopBanner {
  return {
    id: "banner-1",
    name: "Holiday strip",
    description: null,
    config: DEFAULT_PRESSWALL_CONFIG,
    selections: [{ publisherId: "forbes", position: 0 }],
    isDefault: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("OnboardingTemplateStep", () => {
  afterEach(() => {
    cleanup();
  });

  test("shows built-in templates only — hides Saved banners when merchant templates exist", async () => {
    const { OnboardingTemplateStep } = await import(
      "./onboarding-template-step"
    );

    const saved = makeBanner();
    const editor = createPresswallEditorFixture({
      catalog: CATALOG,
      customTemplates: [saved],
      banners: [saved],
      matchedTemplateId: "classic",
      matchedCustomTemplateId: null,
    });

    const { queryByText, getByText } = render(
      <OnboardingTemplateStep
        editor={editor}
        onBack={() => undefined}
        onNext={() => undefined}
      />
    );

    expect(getByText("Built-in templates")).toBeTruthy();
    expect(queryByText("Saved banners")).toBeNull();
    expect(queryByText("Holiday strip")).toBeNull();
  });

  test("does not show Save template button or saved-as feedback", async () => {
    const { OnboardingTemplateStep } = await import(
      "./onboarding-template-step"
    );

    const editor = createPresswallEditorFixture({
      catalog: CATALOG,
      matchedTemplateId: null,
      matchedCustomTemplateId: null,
      config: {
        ...DEFAULT_PRESSWALL_CONFIG,
        headingText: "As featured in",
      },
    });

    const { queryByRole, queryByText } = render(
      <OnboardingTemplateStep
        editor={editor}
        onBack={() => undefined}
        onNext={() => undefined}
      />
    );

    expect(queryByRole("button", { name: SAVE_TEMPLATE_BUTTON })).toBeNull();
    expect(queryByText(SAVED_AS_LABEL)).toBeNull();
  });

  test("auto-creates Custom banner once when design is customized", async () => {
    const { OnboardingTemplateStep } = await import(
      "./onboarding-template-step"
    );

    let createCalls = 0;
    const createOnboardingCustomBanner = mock(() => {
      createCalls += 1;
      return Promise.resolve("Custom banner 1");
    });

    const editor = createPresswallEditorFixture({
      catalog: CATALOG,
      matchedTemplateId: null,
      matchedCustomTemplateId: null,
      config: {
        ...DEFAULT_PRESSWALL_CONFIG,
        headingText: "Customized heading",
      },
      createOnboardingCustomBanner,
    });

    const { rerender } = render(
      <OnboardingTemplateStep
        editor={editor}
        onBack={() => undefined}
        onNext={() => undefined}
      />
    );

    await waitFor(() => {
      expect(createCalls).toBe(1);
    });

    // Further re-renders while still custom should not create again.
    rerender(
      <OnboardingTemplateStep
        editor={{
          ...editor,
          config: {
            ...editor.config,
            logoHeight: 32,
          },
        }}
        onBack={() => undefined}
        onNext={() => undefined}
      />
    );

    await waitFor(() => {
      expect(createCalls).toBe(1);
    });
  });

  test("does not auto-create while a built-in template is selected", async () => {
    const { OnboardingTemplateStep } = await import(
      "./onboarding-template-step"
    );

    let createCalls = 0;
    const createOnboardingCustomBanner = mock(() => {
      createCalls += 1;
      return Promise.resolve("Custom banner 1");
    });

    const editor = createPresswallEditorFixture({
      catalog: CATALOG,
      matchedTemplateId: "classic",
      matchedCustomTemplateId: null,
      createOnboardingCustomBanner,
    });

    render(
      <OnboardingTemplateStep
        editor={editor}
        onBack={() => undefined}
        onNext={() => undefined}
      />
    );

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(createCalls).toBe(0);
  });
});
