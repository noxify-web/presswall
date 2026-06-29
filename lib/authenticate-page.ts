import { authenticateAdmin } from "@/lib/authenticate-admin";

export async function authenticatePage(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
  reloadPath = "/"
) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      query.set(key, value);
    }
  }

  const { shop, session } = await authenticateAdmin(query, reloadPath);

  return {
    shop,
    session,
    shopifyApiKey: process.env.SHOPIFY_API_KEY ?? "",
  };
}
