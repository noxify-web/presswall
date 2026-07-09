import "@shopify/shopify-api/adapters/web-api";
import { ApiVersion, shopifyApi } from "@shopify/shopify-api";
import { getAppUrl } from "@/lib/app-url";
import { sessionStorage } from "@/lib/session-storage";

const PROTOCOL_PREFIX = /^https?:\/\//;

function createShopifyClient() {
  const appUrl = getAppUrl();
  const apiKey = process.env.SHOPIFY_API_KEY ?? "";
  const apiSecret = process.env.SHOPIFY_API_SECRET ?? "";
  const hostName = appUrl.replace(PROTOCOL_PREFIX, "");
  const hostScheme = appUrl.startsWith("https") ? "https" : "http";
  const scopes = (process.env.SCOPES ?? "").split(",").filter(Boolean);

  return shopifyApi({
    apiKey,
    apiSecretKey: apiSecret,
    scopes,
    hostName,
    hostScheme,
    apiVersion: ApiVersion.January25,
    isEmbeddedApp: true,
    sessionStorage,
  });
}

type ShopifyClient = ReturnType<typeof createShopifyClient>;

let shopifyClient: ShopifyClient | undefined;

function getShopifyClient(): ShopifyClient {
  if (!shopifyClient) {
    shopifyClient = createShopifyClient();
  }

  return shopifyClient;
}

export const shopify = new Proxy({} as ShopifyClient, {
  get(_target, property, receiver) {
    const value = Reflect.get(getShopifyClient(), property, receiver);
    if (typeof value === "function") {
      return value.bind(getShopifyClient());
    }

    return value;
  },
});

export function getSessionIdForShop(shop: string): string {
  return shopify.session.getOfflineId(shop);
}
