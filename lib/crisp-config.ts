/**
 * Free Crisp.chat website chatbox configuration helpers.
 * Website ID comes from NEXT_PUBLIC_CRISP_WEBSITE_ID (Crisp free plan).
 * When unset/empty, chat is disabled and the app must still render.
 *
 * Shopify admin iframes often trip Crisp mobile full-view. We force a
 * comfortable bottom-right panel that sits *above* the launcher so the
 * open chat does not cover the bubble/X. The launcher stays in Crisp’s
 * default bottom-right corner (bubble when closed, X when open).
 */

export const CRISP_WEBSITE_ID_ENV = "NEXT_PUBLIC_CRISP_WEBSITE_ID";

/** Free chatbox color theme (SDK `color:theme` / setColorTheme). */
export const CRISP_COLOR_THEME = "black" as const;

/** Comfortable admin chat panel (not full-page, not tiny). */
export const CRISP_PANEL_WIDTH_PX = 390;
export const CRISP_PANEL_HEIGHT_PX = 600;
/** Right inset for the open chat shell. */
export const CRISP_PANEL_OFFSET_PX = 20;
/**
 * Bottom inset for the chat shell so it clears the ~54px launcher/X.
 * Crisp keeps the control bottom-right; panel sits above it.
 */
export const CRISP_LAUNCHER_SIZE_PX = 54;
export const CRISP_LAUNCHER_GAP_PX = 12;
export const CRISP_PANEL_BOTTOM_PX =
  CRISP_PANEL_OFFSET_PX + CRISP_LAUNCHER_SIZE_PX + CRISP_LAUNCHER_GAP_PX;

/**
 * Legacy mark from an earlier top-right close experiment. Cleared on apply
 * so any leftover open-state overrides do not stick the launcher.
 */
export const CRISP_CLOSE_MARK_ATTR = "data-presswall-crisp-close";

/** Inline properties we may have set in older close-button experiments. */
export const CRISP_OVERRIDE_STYLE_PROPS = [
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "width",
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "margin",
  "z-index",
  "transform",
  "transform-origin",
  "display",
  "align-items",
  "justify-content",
] as const;

export interface CrispClient {
  configure: (websiteId: string) => void;
  setColorTheme?: (color: typeof CRISP_COLOR_THEME) => void;
  /** Keep launcher on the right (false = right, true = left). */
  setPositionReverse?: (reversed: boolean) => void;
}

export interface StyleLike {
  getPropertyValue: (name: string) => string;
  removeProperty: (name: string) => void;
  setProperty: (name: string, value: string, priority?: string) => void;
}

export interface ViewportSize {
  height: number;
  width: number;
}

export interface CrispPanelMetrics {
  bottom: number;
  height: number;
  right: number;
  width: number;
}

/**
 * Normalize a Website ID from env or config.
 * Returns null when chat should not load (missing, blank, whitespace-only).
 */
export function resolveCrispWebsiteId(
  raw: string | undefined | null
): string | null {
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed;
}

/** Whether the free Crisp chatbox should load for this Website ID. */
export function shouldLoadCrisp(websiteId: string | null): boolean {
  return websiteId !== null;
}

/**
 * Configure the free Crisp chatbox when a Website ID is present.
 * Black theme + right-side position. Returns true if configure ran.
 */
export function configureCrispChat(
  client: CrispClient,
  rawWebsiteId: string | undefined | null
): boolean {
  const websiteId = resolveCrispWebsiteId(rawWebsiteId);
  if (!shouldLoadCrisp(websiteId) || websiteId === null) {
    return false;
  }
  client.configure(websiteId);
  client.setColorTheme?.(CRISP_COLOR_THEME);
  client.setPositionReverse?.(false);
  return true;
}

/** Read Website ID from process env (public Next.js env at build/runtime). */
export function getCrispWebsiteIdFromEnv(
  env: Record<string, string | undefined> = process.env
): string | null {
  return resolveCrispWebsiteId(env[CRISP_WEBSITE_ID_ENV]);
}

/** Resolve panel size for the current admin iframe viewport. */
export function resolveCrispPanelMetrics(
  viewport: ViewportSize
): CrispPanelMetrics {
  const widthBudget =
    viewport.width > 0
      ? Math.max(300, viewport.width - CRISP_PANEL_OFFSET_PX * 2)
      : CRISP_PANEL_WIDTH_PX;
  const heightBudget =
    viewport.height > 0
      ? Math.max(360, viewport.height - CRISP_PANEL_BOTTOM_PX - 24)
      : CRISP_PANEL_HEIGHT_PX;

  return {
    width: Math.min(CRISP_PANEL_WIDTH_PX, widthBudget),
    height: Math.min(CRISP_PANEL_HEIGHT_PX, heightBudget),
    right: CRISP_PANEL_OFFSET_PX,
    bottom: CRISP_PANEL_BOTTOM_PX,
  };
}

/**
 * Crisp full-view shell: 100% width/height with a large max-width
 * (set inline when the host iframe is treated as mobile).
 */
export function isCrispFullViewPanelStyle(style: StyleLike): boolean {
  const width = style.getPropertyValue("width");
  const height = style.getPropertyValue("height");
  if (width !== "100%" || height !== "100%") {
    return false;
  }
  const maxWidth = Number.parseFloat(style.getPropertyValue("max-width"));
  return !Number.isNaN(maxWidth) && maxWidth > 280;
}

/** Chat conversation shell (not the round launcher). */
export function isCrispChatShellStyle(style: StyleLike): boolean {
  if (isCrispFullViewPanelStyle(style)) {
    return true;
  }
  const width = Number.parseFloat(style.getPropertyValue("width"));
  const height = Number.parseFloat(style.getPropertyValue("height"));
  if (Number.isNaN(width) || Number.isNaN(height)) {
    return false;
  }
  return width >= 280 && height >= 360;
}

/**
 * Pin the open chat as a comfortable bottom-right panel *above* the launcher.
 * Inline !important beats Crisp’s own full-view inline styles.
 */
export function pinCrispPanelBottomRight(
  style: StyleLike,
  viewport: ViewportSize
): boolean {
  if (!isCrispChatShellStyle(style)) {
    return false;
  }

  const panel = resolveCrispPanelMetrics(viewport);
  const already =
    style.getPropertyValue("width") === `${panel.width}px` &&
    style.getPropertyValue("height") === `${panel.height}px` &&
    style.getPropertyValue("bottom") === `${panel.bottom}px` &&
    style.getPropertyValue("right") === `${panel.right}px`;
  if (already) {
    return false;
  }

  style.setProperty("position", "fixed", "important");
  style.setProperty("right", `${panel.right}px`, "important");
  style.setProperty("left", "auto", "important");
  style.setProperty("bottom", `${panel.bottom}px`, "important");
  style.setProperty("top", "auto", "important");
  style.setProperty("width", `${panel.width}px`, "important");
  style.setProperty("height", `${panel.height}px`, "important");
  style.setProperty("max-width", `${panel.width}px`, "important");
  style.setProperty("max-height", `${panel.height}px`, "important");
  return true;
}

/** Remove inline overrides we may have applied (restores Crisp CSS defaults). */
export function clearCrispInlineOverrides(style: StyleLike): number {
  let cleared = 0;
  for (const prop of CRISP_OVERRIDE_STYLE_PROPS) {
    if (style.getPropertyValue(prop) !== "") {
      style.removeProperty(prop);
      cleared += 1;
    }
  }
  return cleared;
}

/**
 * Restore a launcher we previously overrode (legacy top-right close path).
 * Clears our inline styles and the mark attribute.
 */
export function restoreCrispLauncherElement(el: HTMLElement): boolean {
  if (!el.hasAttribute(CRISP_CLOSE_MARK_ATTR)) {
    return false;
  }
  clearCrispInlineOverrides(el.style);
  for (const child of el.querySelectorAll("*")) {
    if (child instanceof HTMLElement) {
      clearCrispInlineOverrides(child.style);
    }
  }
  el.removeAttribute(CRISP_CLOSE_MARK_ATTR);
  return true;
}

/**
 * Force desktop attributes so Crisp shows bubble→close (X) instead of
 * mobile full-page chrome. Returns true if any attribute changed.
 */
export function forceCrispDesktopAttributes(el: Element): boolean {
  if (!(el instanceof HTMLElement)) {
    return false;
  }
  let changed = false;
  if (el.getAttribute("data-full-view") === "true") {
    el.setAttribute("data-full-view", "false");
    changed = true;
  }
  if (el.getAttribute("data-position-reverse") === "true") {
    el.setAttribute("data-position-reverse", "false");
    changed = true;
  }
  if (
    el.hasAttribute("data-small-view") &&
    el.getAttribute("data-small-view") === "true"
  ) {
    el.setAttribute("data-small-view", "false");
    changed = true;
  }
  return changed;
}

export interface ApplyCrispDesktopPanelResult {
  attributes: number;
  panels: number;
  restored: number;
}

/**
 * Apply desktop corner-panel behavior across the live Crisp DOM.
 * - full-view shells → comfortable panel above bottom-right launcher
 * - launcher is left to Crisp (same corner for bubble and X; no overlap)
 * - clears any legacy top-right close overrides if still present
 */
export function applyCrispDesktopPanel(
  root: ParentNode,
  viewport: ViewportSize
): ApplyCrispDesktopPanelResult {
  let attributes = 0;
  let panels = 0;
  let restored = 0;

  const attrNodes = root.querySelectorAll(
    ".crisp-client [data-full-view], .crisp-client [data-position-reverse], #crisp-chatbox[data-full-view], #crisp-chatbox [data-full-view]"
  );
  for (const node of attrNodes) {
    if (forceCrispDesktopAttributes(node)) {
      attributes += 1;
    }
  }
  const chatbox = root.querySelector("#crisp-chatbox, .crisp-client");
  if (chatbox && forceCrispDesktopAttributes(chatbox)) {
    attributes += 1;
  }

  const styleNodes = root.querySelectorAll(
    ".crisp-client [style], #crisp-chatbox [style]"
  );
  for (const node of styleNodes) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (pinCrispPanelBottomRight(node.style, viewport)) {
      panels += 1;
    }
  }

  // Drop legacy top-right close overrides so launcher stays bottom-right.
  const marked = root.querySelectorAll(`[${CRISP_CLOSE_MARK_ATTR}]`);
  for (const node of marked) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (restoreCrispLauncherElement(node)) {
      restored += 1;
    }
  }

  return { attributes, panels, restored };
}
