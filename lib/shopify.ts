import "@shopify/shopify-api/adapters/web-api";
import { ApiVersion, shopifyApi } from "@shopify/shopify-api";
import { sessionStorage } from "@/lib/session-storage";

function getAppUrl(): string {
  return (
    process.env.SHOPIFY_APP_URL ?? process.env.HOST ?? "http://localhost:3000"
  );
}

const appUrl = getAppUrl();
const apiKey = process.env.SHOPIFY_API_KEY ?? "";
const apiSecret = process.env.SHOPIFY_API_SECRET ?? "";
const hostName = appUrl.replace(/^https?:\/\//, "");
const hostScheme = appUrl.startsWith("https") ? "https" : "http";
const scopes = (process.env.SCOPES ?? "").split(",").filter(Boolean);

export const shopify = shopifyApi({
  apiKey,
  apiSecretKey: apiSecret,
  scopes,
  hostName,
  hostScheme,
  apiVersion: ApiVersion.January25,
  isEmbeddedApp: true,
  sessionStorage,
});

export function getSessionIdForShop(shop: string): string {
  return shopify.session.getOfflineId(shop);
}
