import { describe, expect, mock, test } from "bun:test";

import {
  applyCrispDesktopPanel,
  CRISP_CLOSE_BUTTON_INSET_PX,
  CRISP_CLOSE_BUTTON_SIZE_PX,
  CRISP_CLOSE_MARK_ATTR,
  CRISP_COLOR_THEME,
  CRISP_LAUNCHER_NATURAL_SIZE_PX,
  CRISP_PANEL_BOTTOM_PX,
  CRISP_PANEL_HEIGHT_PX,
  CRISP_PANEL_OFFSET_PX,
  CRISP_PANEL_WIDTH_PX,
  CRISP_WEBSITE_ID_ENV,
  clearCrispInlineOverrides,
  configureCrispChat,
  forceCrispDesktopAttributes,
  getCrispWebsiteIdFromEnv,
  isCrispFullViewPanelStyle,
  pinCrispCloseButtonTopRight,
  pinCrispPanelBottomRight,
  resolveCrispCloseButtonLayout,
  resolveCrispPanelMetrics,
  resolveCrispWebsiteId,
  restoreCrispLauncherElement,
  shouldLoadCrisp,
} from "./crisp-config";

function mockConfigure() {
  return mock((_websiteId: string) => undefined);
}

function mockStyle(initial: Record<string, string> = {}) {
  const props = new Map(Object.entries(initial));
  return {
    getPropertyValue(name: string) {
      return props.get(name) ?? "";
    },
    setProperty(name: string, value: string, _priority?: string) {
      props.set(name, value);
    },
    removeProperty(name: string) {
      props.delete(name);
    },
    snapshot() {
      return Object.fromEntries(props.entries());
    },
  };
}

describe("resolveCrispWebsiteId", () => {
  test("returns null for undefined, null, empty, and whitespace", () => {
    expect(resolveCrispWebsiteId(undefined)).toBeNull();
    expect(resolveCrispWebsiteId(null)).toBeNull();
    expect(resolveCrispWebsiteId("")).toBeNull();
    expect(resolveCrispWebsiteId("   ")).toBeNull();
  });

  test("trims and returns a non-empty Website ID", () => {
    expect(resolveCrispWebsiteId("abc-123")).toBe("abc-123");
  });
});

describe("shouldLoadCrisp / configureCrispChat", () => {
  test("skips configure when Website ID is missing", () => {
    const configure = mockConfigure();
    expect(configureCrispChat({ configure }, undefined)).toBe(false);
    expect(configure).not.toHaveBeenCalled();
  });

  test("configures black theme and right-side position", () => {
    const configure = mockConfigure();
    const setColorTheme = mock((_color: string) => undefined);
    const setPositionReverse = mock((_reversed: boolean) => undefined);
    expect(
      configureCrispChat(
        { configure, setColorTheme, setPositionReverse },
        "website-id"
      )
    ).toBe(true);
    expect(configure).toHaveBeenCalledWith("website-id");
    expect(setColorTheme).toHaveBeenCalledWith(CRISP_COLOR_THEME);
    expect(setPositionReverse).toHaveBeenCalledWith(false);
    expect(shouldLoadCrisp("website-id")).toBe(true);
    expect(shouldLoadCrisp(null)).toBe(false);
  });
});

describe("getCrispWebsiteIdFromEnv", () => {
  test("reads NEXT_PUBLIC_CRISP_WEBSITE_ID", () => {
    expect(getCrispWebsiteIdFromEnv({})).toBeNull();
    expect(getCrispWebsiteIdFromEnv({ [CRISP_WEBSITE_ID_ENV]: "env-id" })).toBe(
      "env-id"
    );
  });
});

describe("forceCrispDesktopAttributes", () => {
  test("clears full-view and position-reverse", () => {
    const el = document.createElement("div");
    el.setAttribute("data-full-view", "true");
    el.setAttribute("data-position-reverse", "true");
    el.setAttribute("data-small-view", "true");
    expect(forceCrispDesktopAttributes(el)).toBe(true);
    expect(el.getAttribute("data-full-view")).toBe("false");
    expect(el.getAttribute("data-position-reverse")).toBe("false");
  });
});

describe("pinCrispPanelBottomRight", () => {
  test("sizes full-view shell to comfortable bottom-right panel", () => {
    const style = mockStyle({
      width: "100%",
      height: "100%",
      "max-width": "1100px",
      "max-height": "800px",
    });
    expect(isCrispFullViewPanelStyle(style)).toBe(true);
    expect(pinCrispPanelBottomRight(style, { width: 1200, height: 900 })).toBe(
      true
    );
    const snap = style.snapshot();
    expect(snap.width).toBe(`${CRISP_PANEL_WIDTH_PX}px`);
    expect(snap.height).toBe(`${CRISP_PANEL_HEIGHT_PX}px`);
    expect(snap.bottom).toBe(`${CRISP_PANEL_BOTTOM_PX}px`);
    expect(snap.right).toBe(`${CRISP_PANEL_OFFSET_PX}px`);
  });

  test("does not touch the round launcher button size", () => {
    const style = mockStyle({ width: "54px", height: "54px" });
    expect(pinCrispPanelBottomRight(style, { width: 1200, height: 900 })).toBe(
      false
    );
  });
});

describe("resolveCrispCloseButtonLayout / pinCrispCloseButtonTopRight", () => {
  test("keeps circle and X on one scale (natural box + uniform scale)", () => {
    const viewport = { width: 1200, height: 900 };
    const panel = resolveCrispPanelMetrics(viewport);
    const layout = resolveCrispCloseButtonLayout(panel, viewport);

    // Visual size is smaller; layout box stays Crisp natural so glyph stays centered.
    expect(layout.naturalSize).toBe(CRISP_LAUNCHER_NATURAL_SIZE_PX);
    expect(layout.visualSize).toBe(CRISP_CLOSE_BUTTON_SIZE_PX);
    expect(layout.visualSize).toBeLessThan(layout.naturalSize);
    expect(layout.scale).toBe(layout.visualSize / layout.naturalSize);
    expect(layout.transform).toBe(`scale(${layout.scale})`);
    expect(layout.transformOrigin).toBe("top right");

    // Top-right of panel (not bottom-right resting place).
    const panelTop = viewport.height - panel.bottom - panel.height;
    expect(layout.top).toBe(panelTop + CRISP_CLOSE_BUTTON_INSET_PX);
    expect(layout.right).toBe(panel.right + CRISP_CLOSE_BUTTON_INSET_PX);
  });

  test("applies open-state styles from the pure layout helper", () => {
    const style = mockStyle({});
    const viewport = { width: 1000, height: 800 };
    const panel = resolveCrispPanelMetrics(viewport);
    const layout = pinCrispCloseButtonTopRight(style, panel, viewport);
    const snap = style.snapshot();

    expect(snap.width).toBe(`${layout.naturalSize}px`);
    expect(snap.height).toBe(`${layout.naturalSize}px`);
    expect(snap.transform).toBe(layout.transform);
    expect(snap["transform-origin"]).toBe("top right");
    expect(snap.top).toBe(`${layout.top}px`);
    expect(snap.right).toBe(`${layout.right}px`);
    expect(snap.bottom).toBe("auto");
    // No separate smaller circle — one scale for chrome + glyph.
    expect(snap.width).not.toBe(`${CRISP_CLOSE_BUTTON_SIZE_PX}px`);
  });
});

describe("clearCrispInlineOverrides / restoreCrispLauncherElement", () => {
  test("clears open-state overrides so closed launcher is not stuck top-right", () => {
    const style = mockStyle({
      position: "fixed",
      top: "40px",
      right: "30px",
      bottom: "auto",
      width: "54px",
      height: "54px",
      transform: "scale(0.67)",
      "transform-origin": "top right",
    });
    expect(clearCrispInlineOverrides(style)).toBeGreaterThan(0);
    const snap = style.snapshot();
    expect(snap.top).toBeUndefined();
    expect(snap.right).toBeUndefined();
    expect(snap.transform).toBeUndefined();
    expect(snap.position).toBeUndefined();
  });

  test("restore removes mark and descendant shrink leftovers", () => {
    const el = document.createElement("div");
    el.setAttribute(CRISP_CLOSE_MARK_ATTR, "1");
    el.style.setProperty("top", "12px", "important");
    el.style.setProperty("right", "12px", "important");
    el.style.setProperty("transform", "scale(0.5)", "important");
    const child = document.createElement("div");
    child.style.setProperty("width", "34px", "important");
    child.style.setProperty("height", "34px", "important");
    el.appendChild(child);

    expect(restoreCrispLauncherElement(el)).toBe(true);
    expect(el.hasAttribute(CRISP_CLOSE_MARK_ATTR)).toBe(false);
    expect(el.style.getPropertyValue("top")).toBe("");
    expect(el.style.getPropertyValue("transform")).toBe("");
    expect(child.style.getPropertyValue("width")).toBe("");
    expect(child.style.getPropertyValue("height")).toBe("");
  });

  test("restore is a no-op without our mark", () => {
    const el = document.createElement("div");
    el.style.setProperty("top", "1px");
    expect(restoreCrispLauncherElement(el)).toBe(false);
    expect(el.style.getPropertyValue("top")).toBe("1px");
  });
});

describe("applyCrispDesktopPanel open → close path", () => {
  test("open pins scaled close; close restores bottom-right freedom", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <div class="crisp-client">
        <div id="crisp-chatbox" data-full-view="true">
          <div class="chat-shell"></div>
          <div class="launcher" data-maximized="true"></div>
        </div>
      </div>
    `;
    const shell = root.querySelector(".chat-shell");
    const launcher = root.querySelector(".launcher");
    expect(shell).toBeInstanceOf(HTMLElement);
    expect(launcher).toBeInstanceOf(HTMLElement);
    if (shell instanceof HTMLElement) {
      shell.style.setProperty("width", "100%");
      shell.style.setProperty("height", "100%");
      shell.style.setProperty("max-width", "900px");
      shell.style.setProperty("max-height", "700px");
    }

    const viewport = { width: 1000, height: 800 };
    const openResult = applyCrispDesktopPanel(root, viewport);
    expect(openResult.panels).toBe(1);
    expect(openResult.closeButtons).toBe(1);
    expect(openResult.restored).toBe(0);

    if (launcher instanceof HTMLElement) {
      expect(launcher.getAttribute(CRISP_CLOSE_MARK_ATTR)).toBe("1");
      const layout = resolveCrispCloseButtonLayout(
        resolveCrispPanelMetrics(viewport),
        viewport
      );
      expect(launcher.style.getPropertyValue("top")).toBe(`${layout.top}px`);
      expect(launcher.style.getPropertyValue("right")).toBe(
        `${layout.right}px`
      );
      expect(launcher.style.getPropertyValue("transform")).toBe(
        layout.transform
      );
      expect(launcher.style.getPropertyValue("width")).toBe(
        `${CRISP_LAUNCHER_NATURAL_SIZE_PX}px`
      );
      // Must not be the old broken path (shrunk width without scale).
      expect(launcher.style.getPropertyValue("width")).not.toBe(
        `${CRISP_CLOSE_BUTTON_SIZE_PX}px`
      );
    }

    // Simulate close: Crisp clears maximized.
    if (launcher instanceof HTMLElement) {
      launcher.removeAttribute("data-maximized");
    }

    const closeResult = applyCrispDesktopPanel(root, viewport);
    expect(closeResult.closeButtons).toBe(0);
    expect(closeResult.restored).toBe(1);

    if (launcher instanceof HTMLElement) {
      expect(launcher.hasAttribute(CRISP_CLOSE_MARK_ATTR)).toBe(false);
      // Stuck top-right overrides gone — Crisp CSS can place bubble bottom-right.
      expect(launcher.style.getPropertyValue("top")).toBe("");
      expect(launcher.style.getPropertyValue("right")).toBe("");
      expect(launcher.style.getPropertyValue("transform")).toBe("");
      expect(launcher.style.getPropertyValue("position")).toBe("");
      expect(launcher.style.getPropertyValue("width")).toBe("");
    }
  });
});
