import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { createPresswallEditorFixture } from "@/lib/test-fixtures/presswall-editor-fixture";

const { AdminDashboardView } = await import("./admin-dashboard");

describe("AdminDashboard render routing", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders merchant overview after onboarding", () => {
    const view = render(
      <AdminDashboardView
        editor={createPresswallEditorFixture({ needsOnboarding: false })}
      />
    );

    expect(view.getByText("Storefront preview")).toBeTruthy();
    expect(view.getByRole("button", { name: "Open editor" })).toBeTruthy();
    expect(view.queryByText("Discard")).toBeNull();
  });

  test("renders onboarding flow while needsOnboarding is true", () => {
    const view = render(
      <AdminDashboardView
        editor={createPresswallEditorFixture({ needsOnboarding: true })}
      />
    );

    expect(
      view.getByText("Choose which press logos to show on your store")
    ).toBeTruthy();
    expect(view.queryByText("Quick actions")).toBeNull();
  });

  test("renders loading skeleton while editor is loading", () => {
    const view = render(
      <AdminDashboardView
        editor={createPresswallEditorFixture({
          isLoading: true,
          needsOnboarding: true,
        })}
      />
    );

    expect(view.container.querySelector(".presswall-skeleton")).toBeTruthy();
    expect(view.getByRole("status", { name: "Loading home" })).toBeTruthy();
    expect(view.queryByText("Quick actions")).toBeNull();
  });
});
