import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { DB_PATH } from "./constants";
import { sessions } from "./schema";

const sqlite = new Database(DB_PATH);
sqlite.run("PRAGMA journal_mode = WAL");

export const db = drizzle(sqlite, { schema: { sessions } });
