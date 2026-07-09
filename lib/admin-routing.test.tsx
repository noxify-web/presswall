import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { createPresswallEditorFixture } from "@/lib/test-fixtures/presswall-editor-fixture";

const repoRoot = join(import.meta.dir, "..");

function readSource(relativePath: string) {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("embedded app bridge setup", () => {
  test("root layout loads app bridge in head and mounts persistent sidebar nav", () => {
    const layout = readSource("app/layout.tsx");

    expect(layout).toContain("cdn.shopify.com/shopifycloud/app-bridge.js");
    expect(layout).toContain('name="shopify-api-key"');
    expect(layout).toContain("<head>");
    expect(layout).toContain("PresswallAppNav");
    expect(layout).toContain("EditorAppWindowHost");
  });
});

describe("admin routing structure", () => {
  test("root dashboard renders merchant overview instead of editor workspace", async () => {
    const { AdminDashboardView } = await import(
      "@/components/presswall/admin-dashboard"
    );

    const view = render(
      <AdminDashboardView
        editor={createPresswallEditorFixture({ needsOnboarding: false })}
      />
    );

    expect(view.getByText("Storefront preview")).toBeTruthy();
    expect(view.getByRole("button", { name: "Open editor" })).toBeTruthy();
    expect(view.queryByText("Discard")).toBeNull();
    expect(view.queryByText("Templates")).toBeNull();
  });
});

describe("editor sub-page", () => {
  test("dedicated route mounts full editor workspace", () => {
    const editorView = readSource("components/presswall/editor-view.tsx");
    const editorPage = readSource("app/editor/page.tsx");

    expect(editorView).toContain("EditorWorkspace");
    expect(editorView).toContain("usePresswallEditor");
    expect(editorView).toContain("s-page");
    expect(editorView).toContain("Edit press logos");
    expect(editorPage).toContain("hasEmbeddedEntryParams");
    expect(editorPage).toContain("EditorView");
  });

  test("editor opens via App Window helpers for fullscreen overlay", () => {
    const overview = readSource("components/presswall/merchant-overview.tsx");
    const appWindow = readSource("lib/editor-app-window.ts");
    const host = readSource(
      "components/presswall/editor-app-window-host.tsx"
    );

    expect(overview).toContain("openEditorAppWindow");
    expect(appWindow).toContain("EDITOR_APP_WINDOW_ID");
    expect(appWindow).toContain("openEditorAppWindow");
    expect(appWindow).toContain("presswall-editor-window");
    expect(host).toContain("s-app-window");
    expect(host).toContain("EDITOR_APP_WINDOW_ID");
  });
});

describe("sidebar nav ownership", () => {
  test("page views do not mount duplicate App Bridge nav hosts", () => {
    const adminDashboard = readSource(
      "components/presswall/admin-dashboard.tsx"
    );
    const editorView = readSource("components/presswall/editor-view.tsx");

    expect(adminDashboard).not.toContain("PresswallAppNav");
    expect(editorView).not.toContain("PresswallAppNav");
  });
});
