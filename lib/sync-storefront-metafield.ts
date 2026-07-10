import { getAppUrl } from "@/lib/app-url";
import { resolveMetafieldLogoUrl } from "@/lib/metafield-logo-url";
import { shouldInvertLogos } from "@/lib/presswall-logo-contrast";
import { getStorefrontPayload } from "@/lib/presswall-service";
import type { StorefrontPayload } from "@/lib/presswall-types";

const STOREFRONT_CONFIG_KEY = "storefront_config";
/** App-owned shop metafield namespace (matches shopify.app.toml `shop.metafields.app.*`). */
const STOREFRONT_CONFIG_NAMESPACE = "$app";
const ADMIN_API_VERSION = "2025-01";

const SHOP_ID_QUERY = `
  query PresswallShopId {
    shop {
      id
    }
  }
`;

const METAFIELDS_SET_MUTATION = `
  mutation PresswallStorefrontMetafieldSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        key
        namespace
      }
      userErrors {
        field
        message
      }
    }
  }
`;

interface GraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface ShopIdResult {
  shop: {
    id: string;
  };
}

interface MetafieldsSetResult {
  metafieldsSet: {
    metafields: Array<{ key: string; namespace: string }>;
    userErrors: Array<{ field: string[] | null; message: string }>;
  };
}

async function adminGraphql<T>(
  shop: string,
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<GraphqlResponse<T>> {
  const response = await fetch(
    `https://${shop}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  if (!response.ok) {
    throw new Error(`Admin API request failed (${response.status})`);
  }

  return (await response.json()) as GraphqlResponse<T>;
}

export async function syncStorefrontMetafield(
  shop: string,
  accessToken: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const payload = await getStorefrontPayload(shop);
    const shopIdResult = await adminGraphql<ShopIdResult>(
      shop,
      accessToken,
      SHOP_ID_QUERY
    );

    const shopId = shopIdResult.data?.shop.id;
    if (!shopId) {
      const message =
        shopIdResult.errors?.[0]?.message ?? "Could not resolve shop id";
      return { ok: false, error: message };
    }

    const setResult = await adminGraphql<MetafieldsSetResult>(
      shop,
      accessToken,
      METAFIELDS_SET_MUTATION,
      {
        metafields: [
          {
            ownerId: shopId,
            namespace: STOREFRONT_CONFIG_NAMESPACE,
            key: STOREFRONT_CONFIG_KEY,
            type: "json",
            value: JSON.stringify(serializeStorefrontManifest(shop, payload)),
          },
        ],
      }
    );

    const userErrors = setResult.data?.metafieldsSet.userErrors ?? [];
    if (userErrors.length > 0) {
      return {
        ok: false,
        error: userErrors.map((entry) => entry.message).join("; "),
      };
    }

    if (setResult.errors?.length) {
      return { ok: false, error: setResult.errors[0].message };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Metafield sync failed",
    };
  }
}

function serializeStorefrontPayload(shop: string, payload: StorefrontPayload) {
  const appUrl = getAppUrl();
  return {
    ...payload,
    invertLogos: shouldInvertLogos(payload),
    publishers: payload.publishers.map((publisher) => ({
      id: publisher.id,
      name: publisher.name,
      url: publisher.url,
      logoImageUrl: resolveMetafieldLogoUrl(
        shop,
        publisher.id,
        publisher.logoImageUrl,
        { appUrl, colorMode: payload.colorMode }
      ),
      logoSvg: publisher.logoSvg,
    })),
  };
}

/** Single-banner manifest — no per-page assignment map. */
function serializeStorefrontManifest(shop: string, payload: StorefrontPayload) {
  return {
    version: 3,
    resolveViaProxy: true,
    fallback: serializeStorefrontPayload(shop, payload),
  };
}
