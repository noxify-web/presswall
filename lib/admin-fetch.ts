const ADMIN_URL_PARAM_BLOCKLIST = new Set(["id_token"]);
const SESSION_RETRY_WAIT_ATTEMPTS = [10, 20, 30] as const;
const ID_TOKEN_CALL_TIMEOUT_MS = 1500;

function buildAdminRequest(
  path: string,
  init: RequestInit | undefined,
  token: string | null
) {
  const url = new URL(path, window.location.origin);
  const pageParams = new URLSearchParams(window.location.search);

  pageParams.forEach((value, key) => {
    if (ADMIN_URL_PARAM_BLOCKLIST.has(key)) {
      return;
    }

    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value);
    }
  });

  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init?.body) {
    headers.set("Content-Type", "application/json");
  }

  const search = url.searchParams.toString();

  return {
    url: search ? `${url.pathname}?${search}` : url.pathname,
    init: {
      ...init,
      headers,
    },
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let cachedPageIdToken: string | null = null;

export function captureIdTokenFromUrl() {
  if (typeof window === "undefined") {
    return;
  }

  const token = new URLSearchParams(window.location.search).get("id_token");
  if (token?.trim()) {
    cachedPageIdToken = token.trim();
  }
}

if (typeof window !== "undefined") {
  captureIdTokenFromUrl();
}

async function requestShopifyIdToken(): Promise<string | null> {
  if (typeof window === "undefined" || !window.shopify?.idToken) {
    return null;
  }

  try {
    const token = await Promise.race([
      window.shopify.idToken(),
      sleep(ID_TOKEN_CALL_TIMEOUT_MS).then(() => null),
    ]);

    return typeof token === "string" && token ? token : null;
  } catch {
    return null;
  }
}

async function readShopifyIdToken(waitAttempts: number) {
  for (let attempt = 0; attempt < waitAttempts; attempt += 1) {
    if (cachedPageIdToken) {
      return cachedPageIdToken;
    }

    const token = await requestShopifyIdToken();
    if (token) {
      cachedPageIdToken = token;
      return token;
    }

    if (attempt < waitAttempts - 1) {
      await sleep(200);
    }
  }

  return cachedPageIdToken;
}

export function stripStaleIdTokenFromUrl() {
  if (typeof window === "undefined") {
    return;
  }

  captureIdTokenFromUrl();

  const params = new URLSearchParams(window.location.search);
  if (!params.has("id_token")) {
    return;
  }

  params.delete("id_token");
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
  window.history.replaceState({}, "", nextUrl);
}

function redirectToSessionBounce() {
  const params = new URLSearchParams(window.location.search);
  params.delete("id_token");

  const reloadPath = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  const bounceParams = new URLSearchParams(params);
  bounceParams.set("shopify-reload", reloadPath);

  window.location.assign(`/session-token-bounce?${bounceParams.toString()}`);
}

let inflightSessionToken: Promise<string | null> | null = null;

export function getSessionToken(retryAttempt = 0) {
  const waitAttempts =
    SESSION_RETRY_WAIT_ATTEMPTS[retryAttempt] ??
    SESSION_RETRY_WAIT_ATTEMPTS.at(-1);

  if (retryAttempt === 0) {
    if (!inflightSessionToken) {
      inflightSessionToken = readShopifyIdToken(waitAttempts).finally(() => {
        inflightSessionToken = null;
      });
    }

    return inflightSessionToken;
  }

  return readShopifyIdToken(waitAttempts);
}

export async function adminFetch(
  path: string,
  init?: RequestInit,
  attempt = 0
): Promise<Response> {
  const token = await getSessionToken(attempt);

  if (!token) {
    if (attempt < 2) {
      return adminFetch(path, init, attempt + 1);
    }

    redirectToSessionBounce();
    throw new Error("Session expired. Reload Presswall from Shopify admin.");
  }

  const request = buildAdminRequest(path, init, token);
  const response = await fetch(request.url, request.init);

  if (response.status === 401) {
    cachedPageIdToken = null;

    if (attempt < 2) {
      return adminFetch(path, init, attempt + 1);
    }

    redirectToSessionBounce();
    throw new Error("Session expired. Reload Presswall from Shopify admin.");
  }

  return response;
}
