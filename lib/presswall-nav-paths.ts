/**
 * App Bridge sidebar links use app-relative paths. Embedded shop/host params are
 * preserved by App Bridge navigation — do not bake window.search into hrefs or
 * SSR and client hydration will diverge.
 *
 * Only Home is registered in the sidebar. The editor opens via merchant
 * interaction on Home (App Window / Max modal), not from app nav — App Store
 * requirement 2.2.7.
 */
export function getPresswallNavPaths() {
  return {
    home: "/",
  };
}
