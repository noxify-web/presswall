import { authenticateAdmin } from "@/lib/authenticate-admin";

export async function authenticatePage(
  searchParams: Promise<Record<string, string | string[] | undefined>>
) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      query.set(key, value);
    }
  }

  const { shop } = await authenticateAdmin(query);

  return {
    shop,
    shopifyApiKey: process.env.SHOPIFY_API_KEY ?? "",
  };
}
