import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
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

const SAVE_TEMPLATE_BUTTON = /Save template|Save as template/i;
const SAVED_AS_LABEL = /Saved as/i;

describe("OnboardingTemplateStep", () => {
  afterEach(() => {
    cleanup();
  });

  test("shows built-in templates only — no Saved banners section", async () => {
    const { OnboardingTemplateStep } = await import(
      "./onboarding-template-step"
    );

    const editor = createPresswallEditorFixture({
      catalog: CATALOG,
      matchedTemplateId: "classic",
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
  });

  test("does not show Save template button or multi-banner feedback", async () => {
    const { OnboardingTemplateStep } = await import(
      "./onboarding-template-step"
    );

    const editor = createPresswallEditorFixture({
      catalog: CATALOG,
      matchedTemplateId: null,
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
});
