import { defineConfig } from "drizzle-kit";
import { DB_PATH } from "./src/db/constants";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: DB_PATH,
  },
});
