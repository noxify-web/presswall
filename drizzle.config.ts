import { defineConfig } from "drizzle-kit";
import { getTursoConfig } from "./src/db/constants";

const { url, authToken } = getTursoConfig();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url,
    authToken,
  },
});
