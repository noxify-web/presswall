import { getSessionToken, redirectToSessionBounce } from "@/lib/admin-fetch";
import { buildAdminPath } from "@/lib/admin-path";

const NAVIGATION_TOKEN_MAX_ATTEMPTS = 3;

export async function navigateAdminPath(pathname: string): Promise<void> {
  const path = buildAdminPath(pathname);

  let token: string | null = null;
  for (let attempt = 0; attempt < NAVIGATION_TOKEN_MAX_ATTEMPTS; attempt += 1) {
    token = await getSessionToken(attempt);
    if (token) {
      break;
    }
  }

  if (!token) {
    redirectToSessionBounce(path);
    return;
  }

  const url = new URL(path, window.location.origin);
  url.searchParams.set("id_token", token);
  window.location.assign(`${url.pathname}${url.search}`);
}
