import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { getTursoConfig } from "./constants";
import { publishers, sessions, shopConfigs, shopPublishers } from "./schema";

const { url, authToken } = getTursoConfig();

const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, {
  schema: {
    sessions,
    publishers,
    shopConfigs,
    shopPublishers,
  },
});
