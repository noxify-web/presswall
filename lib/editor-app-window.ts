import { getSessionToken, redirectToSessionBounce } from "@/lib/admin-fetch";
import { navigateAdminPath } from "@/lib/admin-navigation";
import { getAdminSearchParams } from "@/lib/admin-path";

/** DOM id for the shared `<s-app-window>` host in the app shell. */
export const EDITOR_APP_WINDOW_ID = "presswall-editor-window";

/**
 * Fired on `window` when the editor App Window closes so the home overview
 * can reload preview data without a full page refresh.
 */
export const EDITOR_APP_WINDOW_CLOSED_EVENT = "presswall:editor-window-closed";

/**
 * Marks a route as content loaded inside Shopify App Window (fullscreen overlay).
 * Used to hide duplicate sidebar nav registration and tune chrome.
 */
export const APP_WINDOW_QUERY_PARAM = "appWindow";
export const APP_WINDOW_QUERY_VALUE = "1";

const NAVIGATION_TOKEN_MAX_ATTEMPTS = 3;

interface SearchParamsLike {
  get: (key: string) => string | null;
}

export function isAppWindowRequest(
  search:
    | string
    | SearchParamsLike
    | Record<string, string | string[] | undefined>
): boolean {
  if (typeof search === "string") {
    return (
      new URLSearchParams(search).get(APP_WINDOW_QUERY_PARAM) ===
      APP_WINDOW_QUERY_VALUE
    );
  }

  if (
    search &&
    typeof search === "object" &&
    "get" in search &&
    typeof search.get === "function"
  ) {
    return search.get(APP_WINDOW_QUERY_PARAM) === APP_WINDOW_QUERY_VALUE;
  }

  const value = (search as Record<string, string | string[] | undefined>)[
    APP_WINDOW_QUERY_PARAM
  ];
  return value === APP_WINDOW_QUERY_VALUE;
}

/**
 * Builds `/editor?...` for App Window `src`, preserving embedded shop/host
 * params and tagging the load as fullscreen content.
 */
export function buildEditorAppWindowSrc(
  search = typeof window === "undefined" ? "" : window.location.search
): string {
  const params = getAdminSearchParams(search);
  params.set(APP_WINDOW_QUERY_PARAM, APP_WINDOW_QUERY_VALUE);
  const query = params.toString();
  return query
    ? `/editor?${query}`
    : `/editor?${APP_WINDOW_QUERY_PARAM}=${APP_WINDOW_QUERY_VALUE}`;
}

function getEditorAppWindowElement(): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  return document.getElementById(EDITOR_APP_WINDOW_ID);
}

/**
 * Opens the press logo editor in Shopify's fullscreen App Window overlay.
 * Falls back to in-admin navigation when App Window is unavailable.
 *
 * @returns `true` when the App Window overlay was shown; `false` when we fell
 * back to (or stayed on) the in-iframe editor route.
 */
export async function openEditorAppWindow(): Promise<boolean> {
  const element = getEditorAppWindowElement() as
    | (HTMLElement & {
        src?: string;
        show?: () => Promise<void>;
      })
    | null;

  if (!element || typeof element.show !== "function") {
    // In-iframe fallback when App Window is unavailable (still merchant-initiated).
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/editor")
    ) {
      return false;
    }

    await navigateAdminPath("/editor");
    return false;
  }

  let token: string | null = null;
  for (let attempt = 0; attempt < NAVIGATION_TOKEN_MAX_ATTEMPTS; attempt += 1) {
    token = await getSessionToken(attempt);
    if (token) {
      break;
    }
  }

  const src = buildEditorAppWindowSrc();
  if (!token) {
    redirectToSessionBounce(src);
    return false;
  }

  const url = new URL(src, window.location.origin);
  url.searchParams.set("id_token", token);
  element.src = `${url.pathname}${url.search}`;
  await element.show();
  return true;
}
