import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  EDITOR_SAVE_BAR_ID,
  EDITOR_SAVE_BAR_MESSAGE,
  ensureEditorSaveBarElement,
  isEditorSaveBarMessage,
  syncEditorSaveBar,
} from "@/lib/editor-save-bar";

function setShopifyMock(
  value: {
    saveBar?: {
      show: (id: string) => Promise<void>;
      hide: (id: string) => Promise<void>;
    };
  } | null
) {
  Object.defineProperty(window, "shopify", {
    configurable: true,
    writable: true,
    value: value
      ? {
          idToken: async () => "",
          ...value,
        }
      : undefined,
  });
}

describe("editor save bar protocol", () => {
  afterEach(() => {
    document.getElementById(EDITOR_SAVE_BAR_ID)?.remove();
    setShopifyMock(null);
  });

  test("isEditorSaveBarMessage accepts only known message types", () => {
    expect(
      isEditorSaveBarMessage({
        type: EDITOR_SAVE_BAR_MESSAGE.dirty,
        dirty: true,
      })
    ).toBe(true);
    expect(isEditorSaveBarMessage({ type: EDITOR_SAVE_BAR_MESSAGE.save })).toBe(
      true
    );
    expect(
      isEditorSaveBarMessage({ type: EDITOR_SAVE_BAR_MESSAGE.discard })
    ).toBe(true);
    expect(isEditorSaveBarMessage({ type: "unrelated" })).toBe(false);
    expect(isEditorSaveBarMessage(null)).toBe(false);
    expect(isEditorSaveBarMessage("presswall:editor-save")).toBe(false);
  });

  test("ensureEditorSaveBarElement mounts ui-save-bar with only id attribute", () => {
    const onSave = mock(() => undefined);
    const onDiscard = mock(() => undefined);

    const dispose = ensureEditorSaveBarElement({ onSave, onDiscard });

    const bar = document.getElementById(EDITOR_SAVE_BAR_ID);
    expect(bar).not.toBeNull();
    expect(bar?.tagName.toLowerCase()).toBe("ui-save-bar");
    // React must never own this node — no class / data-react attrs.
    expect(bar?.getAttribute("class")).toBeNull();
    expect([...(bar?.attributes ?? [])].map((a) => a.name)).toEqual(["id"]);
    expect(bar?.id).toBe(EDITOR_SAVE_BAR_ID);

    const saveBtn = bar?.querySelector(
      '[data-presswall-save-bar-action="save"]'
    );
    const discardBtn = bar?.querySelector(
      '[data-presswall-save-bar-action="discard"]'
    );
    expect(saveBtn?.textContent).toBe("Save");
    expect(discardBtn?.textContent).toBe("Discard");

    saveBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    discardBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onDiscard).toHaveBeenCalledTimes(1);

    dispose();
  });

  test("ensureEditorSaveBarElement strips illegal attributes before reuse", () => {
    const existing = document.createElement("ui-save-bar");
    existing.id = EDITOR_SAVE_BAR_ID;
    existing.setAttribute("class", "SaveDiscard");
    existing.setAttribute("data-foo", "1");
    document.body.append(existing);

    ensureEditorSaveBarElement({
      onSave: () => undefined,
      onDiscard: () => undefined,
    });

    const bar = document.getElementById(EDITOR_SAVE_BAR_ID);
    expect(bar?.getAttribute("class")).toBeNull();
    expect(bar?.getAttribute("data-foo")).toBeNull();
    expect([...(bar?.attributes ?? [])].map((a) => a.name)).toEqual(["id"]);
  });

  test("syncEditorSaveBar shows and hides via App Bridge API for the shared id", async () => {
    const show = mock(() => Promise.resolve());
    const hide = mock(() => Promise.resolve());
    setShopifyMock({ saveBar: { show, hide } });

    const bar = document.createElement("ui-save-bar");
    bar.id = EDITOR_SAVE_BAR_ID;
    bar.setAttribute("class", "leaked");
    document.body.append(bar);

    await syncEditorSaveBar(true);
    expect(show).toHaveBeenCalledWith(EDITOR_SAVE_BAR_ID);
    expect(bar.getAttribute("class")).toBeNull();

    await syncEditorSaveBar(false);
    expect(hide).toHaveBeenCalledWith(EDITOR_SAVE_BAR_ID);
  });

  test("syncEditorSaveBar no-ops when App Bridge saveBar is unavailable", async () => {
    await expect(syncEditorSaveBar(true)).resolves.toBeUndefined();
  });
});
