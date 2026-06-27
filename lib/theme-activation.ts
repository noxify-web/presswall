const DEFAULT_EXTENSION_UID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const EMBED_BLOCK_HANDLE = "presswall-embed";
const SECTION_BLOCK_HANDLE = "presswall";
const APP_SLUG = "presswall";

const TEMPLATE_FILES = [
  "templates/index.json",
  "templates/product.json",
  "templates/collection.json",
  "templates/page.json",
  "templates/blog.json",
  "templates/article.json",
  "templates/cart.json",
] as const;

const SETTINGS_DATA_FILE = "config/settings_data.json";

export interface ThemeActivationStatus {
  activateEmbedUrl: string;
  activateSectionUrl: string;
  appBlockEnabled: boolean;
  appEmbedEnabled: boolean;
  isActive: boolean;
  themeId: string | null;
  themeName: string | null;
}

interface ThemeBlockEntry {
  disabled?: boolean;
  type?: string;
}

interface ThemeFilesQueryResult {
  data?: {
    themes?: {
      nodes?: Array<{
        id: string;
        name: string;
        files?: {
          nodes?: Array<{
            body?: {
              content?: string;
            };
            filename: string;
          }>;
        };
      }>;
    };
  };
}

function stripJsonComments(content: string): string {
  return content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function parseJsonContent<T>(content: string): T | null {
  try {
    return JSON.parse(stripJsonComments(content)) as T;
  } catch {
    return null;
  }
}

function normalizeShopDomain(shop: string): string {
  return shop.includes(".myshopify.com") ? shop : `${shop}.myshopify.com`;
}

function isPresswallAppBlockType(
  type: string | undefined,
  apiKey: string
): boolean {
  if (!type?.startsWith("shopify://apps/")) {
    return false;
  }

  const appSegment =
    type.slice("shopify://apps/".length).split("/")[0]?.toLowerCase() ?? "";
  const extensionUid =
    process.env.SHOPIFY_PRESSWALL_THEME_ID ?? DEFAULT_EXTENSION_UID;

  return (
    appSegment === apiKey.toLowerCase() ||
    appSegment.includes(APP_SLUG) ||
    type.includes(extensionUid) ||
    type.includes(`/blocks/${EMBED_BLOCK_HANDLE}/`) ||
    type.includes(`/blocks/${SECTION_BLOCK_HANDLE}/`)
  );
}

function isEmbedBlock(type: string | undefined, apiKey: string): boolean {
  if (!type) {
    return false;
  }

  return (
    isPresswallAppBlockType(type, apiKey) &&
    type.includes(`/blocks/${EMBED_BLOCK_HANDLE}/`)
  );
}

function isSectionBlock(type: string | undefined, apiKey: string): boolean {
  if (!type) {
    return false;
  }

  return (
    isPresswallAppBlockType(type, apiKey) &&
    type.includes(`/blocks/${SECTION_BLOCK_HANDLE}/`)
  );
}

function findBlocksInValue(
  value: unknown,
  matcher: (type: string | undefined) => boolean
): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => findBlocksInValue(item, matcher));
  }

  const record = value as Record<string, unknown>;

  if (typeof record.type === "string" && matcher(record.type)) {
    return true;
  }

  for (const nested of Object.values(record)) {
    if (findBlocksInValue(nested, matcher)) {
      return true;
    }
  }

  return false;
}

function parseEmbedStatus(content: string, apiKey: string): boolean {
  const settings = parseJsonContent<{
    current?: { blocks?: Record<string, ThemeBlockEntry> };
  }>(content);

  const blocks = settings?.current?.blocks;
  if (!blocks) {
    return false;
  }

  return Object.values(blocks).some(
    (block) => isEmbedBlock(block.type, apiKey) && block.disabled !== true
  );
}

function parseSectionBlockStatus(content: string, apiKey: string): boolean {
  const template = parseJsonContent<unknown>(content);
  if (!template) {
    return false;
  }

  return findBlocksInValue(template, (type) => isSectionBlock(type, apiKey));
}

export function buildThemeActivationUrls(
  shop: string,
  apiKey: string
): Pick<ThemeActivationStatus, "activateEmbedUrl" | "activateSectionUrl"> {
  const shopDomain = normalizeShopDomain(shop);
  const editorBase = `https://${shopDomain}/admin/themes/current/editor`;

  return {
    activateEmbedUrl: `${editorBase}?context=apps&activateAppId=${apiKey}/${EMBED_BLOCK_HANDLE}`,
    activateSectionUrl: `${editorBase}?template=product&addAppBlockId=${apiKey}/${SECTION_BLOCK_HANDLE}&target=newAppsSection`,
  };
}

const THEME_ACTIVATION_QUERY = `
  query PresswallThemeActivationStatus($filenames: [String!]!) {
    themes(first: 1, roles: [MAIN]) {
      nodes {
        id
        name
        files(filenames: $filenames, first: 20) {
          nodes {
            filename
            body {
              ... on OnlineStoreThemeFileBodyText {
                content
              }
            }
          }
        }
      }
    }
  }
`;

export async function getThemeActivationStatus(
  shop: string,
  accessToken: string,
  apiKey: string
): Promise<ThemeActivationStatus> {
  const urls = buildThemeActivationUrls(shop, apiKey);
  const inactive: ThemeActivationStatus = {
    ...urls,
    appEmbedEnabled: false,
    appBlockEnabled: false,
    isActive: false,
    themeId: null,
    themeName: null,
  };

  const shopDomain = normalizeShopDomain(shop);

  const response = await fetch(
    `https://${shopDomain}/admin/api/2025-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        query: THEME_ACTIVATION_QUERY,
        variables: {
          filenames: [SETTINGS_DATA_FILE, ...TEMPLATE_FILES],
        },
      }),
    }
  );

  if (!response.ok) {
    return inactive;
  }

  const payload = (await response.json()) as ThemeFilesQueryResult;
  const theme = payload.data?.themes?.nodes?.[0];

  if (!theme) {
    return inactive;
  }

  let appEmbedEnabled = false;
  let appBlockEnabled = false;

  for (const file of theme.files?.nodes ?? []) {
    const content = file.body?.content;
    if (!content) {
      continue;
    }

    if (file.filename === SETTINGS_DATA_FILE) {
      appEmbedEnabled = parseEmbedStatus(content, apiKey);
      continue;
    }

    if (appBlockEnabled) {
      continue;
    }

    appBlockEnabled = parseSectionBlockStatus(content, apiKey);
  }

  return {
    ...urls,
    appEmbedEnabled,
    appBlockEnabled,
    isActive: appEmbedEnabled || appBlockEnabled,
    themeId: theme.id,
    themeName: theme.name,
  };
}
