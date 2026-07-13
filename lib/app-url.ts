const TRAILING_SLASH = /\/$/;

/** Stable production host — never a tunnel. Used for storefront-facing assets. */
export const PRODUCTION_APP_URL = "https://presswall.noxify.io";

/**
 * App URL for the current process (OAuth, Admin API host, local tunnel during
 * `bun run dev:shopify`). May be localhost or an ephemeral tunnel host.
 */
export function getAppUrl(): string {
  return (
    process.env.SHOPIFY_APP_URL ?? process.env.HOST ?? "http://localhost:3000"
  );
}

/**
 * True for hosts that die when local dev stops (tunnel / localhost).
 * Never bake these into storefront metafields or proxy logo URLs.
 */
export function isEphemeralAppHost(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:" && protocol !== "http:") {
      return true;
    }
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "[::1]"
    ) {
      return true;
    }
    // Common Shopify CLI / local tunnel providers
    if (
      hostname.endsWith(".ngrok-free.dev") ||
      hostname.endsWith(".ngrok-free.app") ||
      hostname.endsWith(".ngrok.io") ||
      hostname.endsWith(".ngrok.app") ||
      hostname.endsWith(".trycloudflare.com") ||
      hostname.endsWith(".loca.lt") ||
      hostname.endsWith(".localhost.run")
    ) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * Public origin for storefront logo URLs and metafield payloads.
 * Always prefers a stable production host when the process is on a tunnel so
 * dead ngrok/cloudflare URLs never ship to the live Online Store.
 */
export function getPublicAppUrl(): string {
  const configured = getAppUrl().replace(TRAILING_SLASH, "");
  if (isEphemeralAppHost(configured)) {
    return PRODUCTION_APP_URL;
  }
  return configured;
}
