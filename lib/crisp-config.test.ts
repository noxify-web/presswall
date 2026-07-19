import { describe, expect, mock, test } from "bun:test";

import {
  applyCrispDesktopPanel,
  CRISP_CLOSE_MARK_ATTR,
  CRISP_COLOR_THEME,
  CRISP_COMPACT_HEADER_CSS,
  CRISP_COMPACT_HEADER_HEIGHT_PX,
  CRISP_COMPACT_STYLE_ID,
  CRISP_HEADER_CONTENT_MARK_ATTR,
  CRISP_HEADER_TITLE,
  CRISP_HEADER_TITLE_MARK_ATTR,
  CRISP_LAUNCHER_GAP_PX,
  CRISP_LAUNCHER_SIZE_PX,
  CRISP_MODE_BAR_MARK_ATTR,
  CRISP_PANEL_BOTTOM_PX,
  CRISP_PANEL_HEIGHT_PX,
  CRISP_PANEL_OFFSET_PX,
  CRISP_PANEL_WIDTH_PX,
  CRISP_QUICK_REPLIES_MARK_ATTR,
  CRISP_WEBSITE_ID_ENV,
  clearCrispInlineOverrides,
  compactCrispChatHeader,
  configureCrispChat,
  ensureCrispCompactHeaderStyles,
  ensureCrispHeaderTitle,
  forceCrispDesktopAttributes,
  getCrispWebsiteIdFromEnv,
  hideCrispQuickReplies,
  isCrispChatHeaderRootClass,
  isCrispFullViewPanelStyle,
  isCrispQuickReplyChip,
  pinCrispPanelBottomRight,
  resolveCrispPanelMetrics,
  resolveCrispWebsiteId,
  restoreCrispLauncherElement,
  setCrispChatboxVisible,
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

describe("setCrispChatboxVisible", () => {
  test("queues chat:hide and chat:show on window.$crisp", () => {
    const pushes: unknown[] = [];
    const previous = (window as Window & { $crisp?: { push: (cmd: unknown) => void } })
      .$crisp;
    (window as Window & { $crisp: { push: (cmd: unknown) => void } }).$crisp = {
      push: (cmd: unknown) => {
        pushes.push(cmd);
      },
    };

    try {
      setCrispChatboxVisible(false);
      setCrispChatboxVisible(true);
      expect(pushes).toEqual([
        ["do", "chat:hide"],
        ["do", "chat:show"],
      ]);
    } finally {
      if (previous === undefined) {
        Reflect.deleteProperty(window, "$crisp");
      } else {
        (window as Window & { $crisp?: typeof previous }).$crisp = previous;
      }
    }
  });
});

describe("shouldLoadCrisp / configureCrispChat", () => {
  test("skips configure when Website ID is missing", () => {
    const configure = mockConfigure();
    expect(configureCrispChat({ configure }, undefined)).toBe(false);
    expect(configure).not.toHaveBeenCalled();
  });

  test("configures black theme, right-side position, and compact chrome", () => {
    const configure = mockConfigure();
    const setColorTheme = mock((_color: string) => undefined);
    const setPositionReverse = mock((_reversed: boolean) => undefined);
    const setAvailabilityTooltip = mock((_enabled: boolean) => undefined);
    const toggleOperatorCount = mock((_enabled: boolean) => undefined);
    expect(
      configureCrispChat(
        {
          configure,
          setColorTheme,
          setPositionReverse,
          setAvailabilityTooltip,
          toggleOperatorCount,
        },
        "website-id"
      )
    ).toBe(true);
    expect(configure).toHaveBeenCalledWith("website-id");
    expect(setColorTheme).toHaveBeenCalledWith(CRISP_COLOR_THEME);
    expect(setPositionReverse).toHaveBeenCalledWith(false);
    expect(setAvailabilityTooltip).toHaveBeenCalledWith(false);
    expect(toggleOperatorCount).toHaveBeenCalledWith(false);
    expect(shouldLoadCrisp("website-id")).toBe(true);
    expect(shouldLoadCrisp(null)).toBe(false);
  });
});

describe("compact open-chat header", () => {
  test("detects Crisp chat header root classes by substring", () => {
    expect(
      isCrispChatHeaderRootClass(
        "cc-1wrj8 cc-1wrj8--mode-chat cc-1wrj8--status-ongoing"
      )
    ).toBe(true);
    expect(
      isCrispChatHeaderRootClass(
        "cc-1wrj8 cc-1wrj8--mode-chat cc-1wrj8--chat-conversations"
      )
    ).toBe(true);
    expect(isCrispChatHeaderRootClass("cc-1wrj8 cc-1wrj8--mode-home")).toBe(
      false
    );
    expect(isCrispChatHeaderRootClass("unrelated")).toBe(false);
  });

  test("compact CSS targets mode-chat header heights and centers content", () => {
    expect(CRISP_COMPACT_HEADER_CSS).toContain(
      `${CRISP_COMPACT_HEADER_HEIGHT_PX}px`
    );
    expect(CRISP_COMPACT_HEADER_CSS).toContain("--mode-chat");
    expect(CRISP_COMPACT_HEADER_CSS).toContain("--status-ongoing");
    expect(CRISP_COMPACT_HEADER_CSS).toContain(CRISP_MODE_BAR_MARK_ATTR);
    expect(CRISP_COMPACT_HEADER_CSS).toContain(CRISP_HEADER_CONTENT_MARK_ATTR);
    expect(CRISP_COMPACT_HEADER_CSS).toContain("justify-content: center");
    expect(CRISP_COMPACT_HEADER_CSS).toContain('data-type="speech"');
    expect(CRISP_COMPACT_HEADER_CSS).toContain(CRISP_QUICK_REPLIES_MARK_ATTR);
    expect(CRISP_COMPACT_HEADER_CSS).toContain(CRISP_HEADER_TITLE_MARK_ATTR);
  });

  test("ensureCrispHeaderTitle injects brand label once", () => {
    const content = document.createElement("div");
    content.setAttribute(CRISP_HEADER_CONTENT_MARK_ATTR, "1");
    expect(ensureCrispHeaderTitle(content)).toBe(true);
    const title = content.querySelector(`[${CRISP_HEADER_TITLE_MARK_ATTR}]`);
    expect(title?.textContent).toBe(CRISP_HEADER_TITLE);
    expect(ensureCrispHeaderTitle(content)).toBe(false);
    expect(ensureCrispHeaderTitle(content, "Questions?")).toBe(true);
    expect(title?.textContent).toBe("Questions?");
  });

  test("isCrispQuickReplyChip matches short aria-label chips only", () => {
    const chip = document.createElement("div");
    chip.setAttribute("role", "button");
    chip.setAttribute("aria-label", "Talk to sales");
    chip.textContent = "Talk to sales";
    expect(isCrispQuickReplyChip(chip)).toBe(true);

    const speech = document.createElement("div");
    speech.setAttribute("role", "button");
    speech.setAttribute("aria-label", "Record");
    speech.setAttribute("data-type", "speech");
    speech.textContent = "Record";
    expect(isCrispQuickReplyChip(speech)).toBe(false);

    const mismatch = document.createElement("div");
    mismatch.setAttribute("role", "button");
    mismatch.setAttribute("aria-label", "Close");
    mismatch.textContent = "X";
    expect(isCrispQuickReplyChip(mismatch)).toBe(false);
  });

  test("hideCrispQuickReplies marks chip containers", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <div class="crisp-client">
        <div class="quick-replies-wrap">
          <div class="quick-replies-row">
            <div role="button" aria-label="I need help">I need help</div>
            <div role="button" aria-label="Pricing">Pricing</div>
          </div>
        </div>
      </div>
    `;
    expect(hideCrispQuickReplies(root)).toBe(1);
    expect(
      root
        .querySelector(".quick-replies-wrap")
        ?.getAttribute(CRISP_QUICK_REPLIES_MARK_ATTR)
    ).toBe("1");
    expect(hideCrispQuickReplies(root)).toBe(0);
  });

  test("ensureCrispCompactHeaderStyles injects once", () => {
    const existing = new Map<string, HTMLElement>();
    const created: HTMLElement[] = [];
    const doc = {
      getElementById(id: string) {
        return existing.get(id) ?? null;
      },
      createElement(tag: string) {
        const el = document.createElement(tag);
        created.push(el);
        return el;
      },
      head: {
        appendChild(node: Node) {
          if (node instanceof HTMLElement && node.id) {
            existing.set(node.id, node);
          }
          return node;
        },
      },
    };
    expect(ensureCrispCompactHeaderStyles(doc)).toBe(true);
    expect(created).toHaveLength(1);
    expect(created[0]?.id).toBe(CRISP_COMPACT_STYLE_ID);
    expect(created[0]?.textContent).toContain("--mode-chat");
    expect(ensureCrispCompactHeaderStyles(doc)).toBe(false);
    expect(created).toHaveLength(1);
  });

  test("compactCrispChatHeader marks mode switcher and brand title", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <div class="crisp-client">
        <div class="cc-1wrj8 cc-1wrj8--mode-chat cc-1wrj8--status-ongoing">
          <span class="cc-djbaw mode-bar"><button type="button">Messages</button></span>
          <div class="operator-row">Nithish from Noxify</div>
          <span class="pad-menu"></span>
        </div>
      </div>
    `;
    expect(compactCrispChatHeader(root)).toBeGreaterThanOrEqual(1);
    const modeBar = root.querySelector(".mode-bar");
    const content = root.querySelector(".operator-row");
    expect(modeBar?.getAttribute(CRISP_MODE_BAR_MARK_ATTR)).toBe("1");
    expect(content?.getAttribute(CRISP_HEADER_CONTENT_MARK_ATTR)).toBe("1");
    expect(
      content?.querySelector(`[${CRISP_HEADER_TITLE_MARK_ATTR}]`)?.textContent
    ).toBe(CRISP_HEADER_TITLE);
    // Idempotent once title is correct
    expect(compactCrispChatHeader(root)).toBe(0);
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

describe("panel sits above bottom-right launcher (no overlap)", () => {
  test("panel bottom clears launcher size + gap", () => {
    expect(CRISP_PANEL_BOTTOM_PX).toBe(
      CRISP_PANEL_OFFSET_PX + CRISP_LAUNCHER_SIZE_PX + CRISP_LAUNCHER_GAP_PX
    );
    expect(CRISP_PANEL_BOTTOM_PX).toBeGreaterThan(CRISP_LAUNCHER_SIZE_PX);
  });

  test("sizes full-view shell above the launcher corner", () => {
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
    // Panel bottom is higher than a typical launcher bottom (~20px).
    expect(Number.parseInt(snap.bottom ?? "0", 10)).toBeGreaterThan(60);
  });

  test("does not touch the round launcher button size", () => {
    const style = mockStyle({ width: "54px", height: "54px" });
    expect(pinCrispPanelBottomRight(style, { width: 1200, height: 900 })).toBe(
      false
    );
  });

  test("resolveCrispPanelMetrics keeps bottom clearance", () => {
    const panel = resolveCrispPanelMetrics({ width: 1000, height: 800 });
    expect(panel.bottom).toBe(CRISP_PANEL_BOTTOM_PX);
    expect(panel.right).toBe(CRISP_PANEL_OFFSET_PX);
  });
});

describe("legacy close override restore", () => {
  test("clearCrispInlineOverrides strips stuck top-right styles", () => {
    const style = mockStyle({
      position: "fixed",
      top: "40px",
      right: "30px",
      transform: "scale(0.67)",
    });
    expect(clearCrispInlineOverrides(style)).toBeGreaterThan(0);
    expect(style.snapshot().top).toBeUndefined();
    expect(style.snapshot().transform).toBeUndefined();
  });

  test("restoreCrispLauncherElement clears mark and styles", () => {
    const el = document.createElement("div");
    el.setAttribute(CRISP_CLOSE_MARK_ATTR, "1");
    el.style.setProperty("top", "12px", "important");
    el.style.setProperty("transform", "scale(0.5)", "important");
    expect(restoreCrispLauncherElement(el)).toBe(true);
    expect(el.hasAttribute(CRISP_CLOSE_MARK_ATTR)).toBe(false);
    expect(el.style.getPropertyValue("top")).toBe("");
  });
});

describe("applyCrispDesktopPanel", () => {
  function mockDoc() {
    const existing = new Map<string, HTMLElement>();
    return {
      getElementById(id: string) {
        return existing.get(id) ?? null;
      },
      createElement(tag: string) {
        return document.createElement(tag);
      },
      head: {
        appendChild(node: Node) {
          if (node instanceof HTMLElement && node.id) {
            existing.set(node.id, node);
          }
          return node;
        },
      },
    };
  }

  test("pins panel above launcher and does not reposition open launcher", () => {
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

    const result = applyCrispDesktopPanel(
      root,
      { width: 1000, height: 800 },
      mockDoc()
    );
    expect(result.panels).toBe(1);
    expect(result.restored).toBe(0);
    expect(result.styles).toBe(true);
    expect(result.headers).toBe(0);

    if (shell instanceof HTMLElement) {
      expect(shell.style.getPropertyValue("bottom")).toBe(
        `${CRISP_PANEL_BOTTOM_PX}px`
      );
    }
    // Launcher left alone (Crisp owns bubble ↔ X at bottom-right).
    if (launcher instanceof HTMLElement) {
      expect(launcher.style.getPropertyValue("top")).toBe("");
      expect(launcher.style.getPropertyValue("transform")).toBe("");
      expect(launcher.hasAttribute(CRISP_CLOSE_MARK_ATTR)).toBe(false);
    }
  });

  test("compacts open-chat header mode bar while pinning panel", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <div class="crisp-client">
        <div class="cc-1wrj8 cc-1wrj8--mode-chat cc-1wrj8--status-ongoing">
          <span class="mode-bar">Messages</span>
          <div class="operator">Nithish from Noxify</div>
        </div>
      </div>
    `;
    const result = applyCrispDesktopPanel(
      root,
      { width: 1000, height: 800 },
      mockDoc()
    );
    expect(result.headers).toBe(1);
    expect(result.styles).toBe(true);
    expect(
      root.querySelector(".mode-bar")?.getAttribute(CRISP_MODE_BAR_MARK_ATTR)
    ).toBe("1");
    expect(
      root
        .querySelector(".operator")
        ?.getAttribute(CRISP_HEADER_CONTENT_MARK_ATTR)
    ).toBe("1");
  });

  test("clears legacy marked close overrides so launcher is free", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <div class="crisp-client">
        <div class="launcher" data-presswall-crisp-close="1" style="top: 10px; right: 10px; transform: scale(0.5);"></div>
      </div>
    `;
    // attribute selector uses CRISP_CLOSE_MARK_ATTR constant value
    const launcher = root.querySelector(".launcher");
    expect(launcher).toBeInstanceOf(HTMLElement);
    if (launcher instanceof HTMLElement) {
      launcher.setAttribute(CRISP_CLOSE_MARK_ATTR, "1");
      launcher.style.setProperty("top", "10px", "important");
      launcher.style.setProperty("right", "10px", "important");
      launcher.style.setProperty("transform", "scale(0.5)", "important");
    }

    const result = applyCrispDesktopPanel(
      root,
      { width: 1000, height: 800 },
      mockDoc()
    );
    expect(result.restored).toBe(1);
    if (launcher instanceof HTMLElement) {
      expect(launcher.hasAttribute(CRISP_CLOSE_MARK_ATTR)).toBe(false);
      expect(launcher.style.getPropertyValue("top")).toBe("");
      expect(launcher.style.getPropertyValue("transform")).toBe("");
    }
  });
});
