/**
 * Free Crisp.chat website chatbox configuration helpers.
 * Website ID comes from NEXT_PUBLIC_CRISP_WEBSITE_ID (Crisp free plan).
 * When unset/empty, chat is disabled and the app must still render.
 *
 * Shopify admin iframes often trip Crisp mobile full-view. We force a
 * comfortable bottom-right panel that sits *above* the launcher so the
 * open chat does not cover the bubble/X. The launcher stays in Crisp’s
 * default bottom-right corner (bubble when closed, X when open).
 *
 * Open-chat header is also compacted: Crisp’s default chrome is ~110px
 * (mode switcher + operator row). We hide the mode bar and shrink the
 * remaining header so messages get more space in the admin iframe.
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
 * Compact open-chat header height (operator / title row only).
 * Crisp defaults to ~110px with mode switcher + status row.
 */
export const CRISP_COMPACT_HEADER_HEIGHT_PX = 52;
/** Slightly taller for the empty-state / initial header. */
export const CRISP_COMPACT_HEADER_INITIAL_HEIGHT_PX = 72;

/**
 * Replaces Crisp’s “{Operator} from {Workspace}” open-chat header label.
 * That string comes from the operator nickname + Crisp website name (e.g.
 * “Nithish from Noxify”), not from Presswall branding.
 */
export const CRISP_HEADER_TITLE = "Chat with us";

/**
 * Legacy mark from an earlier top-right close experiment. Cleared on apply
 * so any leftover open-state overrides do not stick the launcher.
 */
export const CRISP_CLOSE_MARK_ATTR = "data-presswall-crisp-close";

/** Marks the Crisp mode switcher (home + Messages) we hide when compacting. */
export const CRISP_MODE_BAR_MARK_ATTR = "data-presswall-crisp-mode-bar";

/**
 * Marks the operator/title content row under the compact header so we can
 * center it reliably (Crisp uses float:left on avatars by default).
 */
export const CRISP_HEADER_CONTENT_MARK_ATTR =
  "data-presswall-crisp-header-content";

/** Our injected brand title node inside the compact header content row. */
export const CRISP_HEADER_TITLE_MARK_ATTR = "data-presswall-crisp-header-title";

/** Marks Crisp quick-reply / quick-action chip rows we hide. */
export const CRISP_QUICK_REPLIES_MARK_ATTR =
  "data-presswall-crisp-quick-replies";

/** Injected stylesheet id for compact-header overrides. */
export const CRISP_COMPACT_STYLE_ID = "presswall-crisp-compact-header";

/**
 * CSS overrides for the free chatbox in the admin iframe:
 * - compact + center the open-chat header
 * - replace “Operator from Workspace” with Presswall title
 * - hide visitor audio/voice recording controls
 * - hide quick replies / quick-action chips
 *
 * Uses class *substring* matchers so hashed Crisp prefixes still match after
 * client rebuilds. Speech control uses stable `data-type="speech"`.
 */
export const CRISP_COMPACT_HEADER_CSS = `
.crisp-client [${CRISP_MODE_BAR_MARK_ATTR}] {
  display: none !important;
}
.crisp-client [class*="--mode-chat"][class*="--status-ongoing"],
.crisp-client [class*="--mode-chat"][class*="--status-agent"],
.crisp-client [class*="--mode-chat"][class*="--chat-conversations"] {
  height: ${CRISP_COMPACT_HEADER_HEIGHT_PX}px !important;
  max-height: ${CRISP_COMPACT_HEADER_HEIGHT_PX}px !important;
  min-height: 0 !important;
  padding-top: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
}
.crisp-client [class*="--mode-chat"][class*="--status-initial"] {
  height: ${CRISP_COMPACT_HEADER_INITIAL_HEIGHT_PX}px !important;
  max-height: ${CRISP_COMPACT_HEADER_INITIAL_HEIGHT_PX}px !important;
  min-height: 0 !important;
  padding-top: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
}
/* Title row: full width, centered; hide Crisp operator chrome. */
.crisp-client [${CRISP_HEADER_CONTENT_MARK_ATTR}] {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  width: 100% !important;
  margin: 0 !important;
  padding-block: 0 !important;
  padding-inline: 40px !important;
  box-sizing: border-box !important;
  text-align: center !important;
  pointer-events: none !important;
  position: relative !important;
}
/* Hide Crisp’s avatar + “Name from Workspace” (keep only our title node). */
.crisp-client [${CRISP_HEADER_CONTENT_MARK_ATTR}] > :not([${CRISP_HEADER_TITLE_MARK_ATTR}]) {
  display: none !important;
}
.crisp-client [${CRISP_HEADER_TITLE_MARK_ATTR}] {
  display: block !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  color: rgb(var(--crisp-color-text-black-normal, 17, 17, 17)) !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  line-height: 20px !important;
  letter-spacing: 0.1px !important;
  text-align: center !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  pointer-events: none !important;
}
/* Hide visitor voice/audio recording (mic button + active record strip). */
.crisp-client [data-type="speech"],
.crisp-client [data-type=speech] {
  display: none !important;
  pointer-events: none !important;
  width: 0 !important;
  height: 0 !important;
  min-width: 0 !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  opacity: 0 !important;
}
/* Hide quick replies / quick-action chips above the composer. */
.crisp-client [${CRISP_QUICK_REPLIES_MARK_ATTR}] {
  display: none !important;
  height: 0 !important;
  max-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
  opacity: 0 !important;
}
`.trim();

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
  /** Closed-state availability tooltip (not the open header). */
  setAvailabilityTooltip?: (enabled: boolean) => void;
  setColorTheme?: (color: typeof CRISP_COLOR_THEME) => void;
  /** Keep launcher on the right (false = right, true = left). */
  setPositionReverse?: (reversed: boolean) => void;
  /** Operator-count badge on the launcher. */
  toggleOperatorCount?: (enabled: boolean) => void;
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
 * Black theme + right-side position. Trims closed-state chrome too.
 * Returns true if configure ran.
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
  // Closed bubble: no availability tooltip; no operator count badge.
  client.setAvailabilityTooltip?.(false);
  client.toggleOperatorCount?.(false);
  return true;
}

/** Minimal document surface used to inject compact-header CSS. */
export interface CrispStyleDocument {
  createElement: (tagName: string) => HTMLElement;
  getElementById: (elementId: string) => HTMLElement | null;
  head: { appendChild: (node: Node) => Node };
}

/**
 * Inject (once) CSS that shrinks the open-chat header in the admin iframe.
 * Returns true when a new style tag was inserted.
 */
export function ensureCrispCompactHeaderStyles(
  doc: CrispStyleDocument
): boolean {
  const existing = doc.getElementById(CRISP_COMPACT_STYLE_ID);
  if (existing) {
    // Keep CSS current across HMR / config tweaks.
    if (existing.textContent !== CRISP_COMPACT_HEADER_CSS) {
      existing.textContent = CRISP_COMPACT_HEADER_CSS;
      return true;
    }
    return false;
  }
  const style = doc.createElement("style");
  style.id = CRISP_COMPACT_STYLE_ID;
  style.textContent = CRISP_COMPACT_HEADER_CSS;
  doc.head.appendChild(style);
  return true;
}

/** True when a class list looks like Crisp’s open chat header root. */
export function isCrispChatHeaderRootClass(className: string): boolean {
  if (!className.includes("--mode-chat")) {
    return false;
  }
  return (
    className.includes("--status-") ||
    className.includes("--chat-conversations")
  );
}

function elementClassName(el: Element): string {
  return typeof el.className === "string" ? el.className : String(el.className);
}

/** Mark mode bar once; returns true when the attribute was newly set. */
function markCrispModeBar(modeBar: Element | null): boolean {
  if (!(modeBar instanceof HTMLElement)) {
    return false;
  }
  if (modeBar.hasAttribute(CRISP_MODE_BAR_MARK_ATTR)) {
    return false;
  }
  modeBar.setAttribute(CRISP_MODE_BAR_MARK_ATTR, "1");
  return true;
}

/**
 * Inject/update our brand header title inside a marked content row.
 * Returns true when the DOM changed (new node or text update).
 */
export function ensureCrispHeaderTitle(
  content: HTMLElement,
  title: string = CRISP_HEADER_TITLE
): boolean {
  const existing = content.querySelector(`[${CRISP_HEADER_TITLE_MARK_ATTR}]`);
  if (existing instanceof HTMLElement) {
    if (existing.textContent === title) {
      return false;
    }
    existing.textContent = title;
    return true;
  }
  const label = content.ownerDocument.createElement("span");
  label.setAttribute(CRISP_HEADER_TITLE_MARK_ATTR, "1");
  label.textContent = title;
  content.appendChild(label);
  return true;
}

/** Find and mark the operator/title content row after the mode bar. */
function markCrispHeaderContent(modeBar: Element | null): boolean {
  let content: Element | null = modeBar?.nextElementSibling ?? null;
  while (content instanceof HTMLElement) {
    const style = content.getAttribute("style") ?? "";
    const cls = elementClassName(content);
    const looksLikePad =
      cls.includes("pad") ||
      style.includes("position: absolute") ||
      style.includes("position:absolute");
    if (looksLikePad) {
      content = content.nextElementSibling;
      continue;
    }
    let changed = false;
    if (!content.hasAttribute(CRISP_HEADER_CONTENT_MARK_ATTR)) {
      content.setAttribute(CRISP_HEADER_CONTENT_MARK_ATTR, "1");
      changed = true;
    }
    if (ensureCrispHeaderTitle(content)) {
      changed = true;
    }
    return changed;
  }
  return false;
}

/**
 * Mark the mode switcher (hide), operator row, and brand title.
 * Crisp always renders: modes → content → pad menu (absolute chevron).
 * Returns how many header roots were newly compacted / retitled.
 */
export function compactCrispChatHeader(root: ParentNode): number {
  let compacted = 0;
  const nodes =
    typeof root.querySelectorAll === "function"
      ? root.querySelectorAll(".crisp-client [class], #crisp-chatbox [class]")
      : [];

  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (!isCrispChatHeaderRootClass(elementClassName(node))) {
      continue;
    }

    const modeBar = node.firstElementChild;
    const modeMarked = markCrispModeBar(modeBar);
    const contentMarked = markCrispHeaderContent(modeBar);
    if (modeMarked || contentMarked) {
      compacted += 1;
    }
  }

  // Re-apply title if Crisp re-rendered content we already marked.
  const markedContent =
    typeof root.querySelectorAll === "function"
      ? root.querySelectorAll(`[${CRISP_HEADER_CONTENT_MARK_ATTR}]`)
      : [];
  for (const content of markedContent) {
    if (!(content instanceof HTMLElement)) {
      continue;
    }
    if (ensureCrispHeaderTitle(content)) {
      compacted += 1;
    }
  }

  return compacted;
}

/** True when a button looks like a Crisp quick-reply chip (not chrome controls). */
export function isCrispQuickReplyChip(el: Element): boolean {
  if (!(el instanceof HTMLElement)) {
    return false;
  }
  if (el.getAttribute("role") !== "button") {
    return false;
  }
  // Composer / speech / attach use data-type; skip those.
  if (el.hasAttribute("data-type") || el.closest("[data-type]")) {
    return false;
  }
  const label = el.getAttribute("aria-label")?.trim() ?? "";
  const text = (el.textContent ?? "").trim();
  if (!label || label !== text) {
    return false;
  }
  // Chips are short suggested replies, not long chrome labels.
  if (text.length === 0 || text.length > 80) {
    return false;
  }
  return true;
}

function countQuickReplyChips(row: HTMLElement): number {
  let chipCount = 0;
  for (const child of row.children) {
    if (isCrispQuickReplyChip(child)) {
      chipCount += 1;
    }
  }
  return chipCount;
}

/** Resolve the outer quick-replies wrapper for a chip row, or null. */
function resolveQuickRepliesContainer(row: HTMLElement): HTMLElement | null {
  const container = row.parentElement;
  if (!(container instanceof HTMLElement)) {
    return null;
  }
  // Avoid marking huge shells (whole chat / header).
  if (
    container.classList.contains("crisp-client") ||
    container.id === "crisp-chatbox"
  ) {
    return null;
  }
  if (container.querySelectorAll('[role="button"]').length > 12) {
    return null;
  }
  return container;
}

/**
 * Mark quick-reply / quick-action chip rows for CSS hide.
 * Crisp renders them as role=button chips whose aria-label equals the text.
 * Returns how many containers were newly marked.
 */
export function hideCrispQuickReplies(root: ParentNode): number {
  const buttons =
    typeof root.querySelectorAll === "function"
      ? root.querySelectorAll('.crisp-client [role="button"][aria-label]')
      : [];

  const containers = new Set<HTMLElement>();
  for (const btn of buttons) {
    if (!isCrispQuickReplyChip(btn)) {
      continue;
    }
    const row = btn.parentElement;
    if (!(row instanceof HTMLElement) || countQuickReplyChips(row) === 0) {
      continue;
    }
    const container = resolveQuickRepliesContainer(row);
    if (container) {
      containers.add(container);
    }
  }

  let marked = 0;
  for (const el of containers) {
    if (el.hasAttribute(CRISP_QUICK_REPLIES_MARK_ATTR)) {
      continue;
    }
    el.setAttribute(CRISP_QUICK_REPLIES_MARK_ATTR, "1");
    marked += 1;
  }
  return marked;
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
  headers: number;
  panels: number;
  quickReplies: number;
  restored: number;
  styles: boolean;
}

/**
 * Apply desktop corner-panel behavior across the live Crisp DOM.
 * - full-view shells → comfortable panel above bottom-right launcher
 * - launcher is left to Crisp (same corner for bubble and X; no overlap)
 * - clears any legacy top-right close overrides if still present
 * - injects compact-header CSS and hides the home/Messages mode bar
 * - hides quick-reply / quick-action chips above the composer
 */
export function applyCrispDesktopPanel(
  root: ParentNode,
  viewport: ViewportSize,
  doc: CrispStyleDocument | null = typeof document === "undefined"
    ? null
    : document
): ApplyCrispDesktopPanelResult {
  let attributes = 0;
  let panels = 0;
  let restored = 0;

  const styles = doc ? ensureCrispCompactHeaderStyles(doc) : false;
  const headers = compactCrispChatHeader(root);
  const quickReplies = hideCrispQuickReplies(root);

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

  return { attributes, headers, panels, quickReplies, restored, styles };
}
