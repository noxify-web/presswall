import { createClient } from "@libsql/client";
import { getTursoConfig } from "../src/db/constants";

const MIGRATIONS = [
  "ALTER TABLE shop_configs ADD COLUMN logos_per_row integer DEFAULT 4 NOT NULL",
  "ALTER TABLE shop_configs ADD COLUMN logos_per_row_mobile integer DEFAULT 2 NOT NULL",
  "ALTER TABLE shop_configs ADD COLUMN heading_font_size integer DEFAULT 12 NOT NULL",
  "ALTER TABLE shop_configs ADD COLUMN heading_spacing integer DEFAULT 20 NOT NULL",
  "ALTER TABLE shop_configs ADD COLUMN logo_alignment text DEFAULT 'center' NOT NULL",
  "UPDATE shop_configs SET logo_alignment = alignment",
  "CREATE INDEX IF NOT EXISTS shop_publishers_shop_idx ON shop_publishers (shop)",
  "DROP TABLE IF EXISTS shop_templates",
  `CREATE TABLE IF NOT EXISTS shop_custom_templates (
    id text PRIMARY KEY NOT NULL,
    shop text NOT NULL,
    name text NOT NULL,
    description text,
    config_json text NOT NULL,
    created_at text NOT NULL,
    updated_at text NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS shop_custom_templates_shop_idx ON shop_custom_templates (shop)",
  "ALTER TABLE shop_configs ADD COLUMN logo_spacing text DEFAULT 'space-between' NOT NULL",
  "UPDATE shop_configs SET logo_spacing = 'space-between' WHERE layout = 'bar'",
  `UPDATE shop_configs
    SET logo_height = 11,
        heading_font_size = 12,
        heading_spacing = 40,
        gap = 12
    WHERE logo_height >= 16`,
  "UPDATE shop_configs SET logo_height = logo_height * 2, gap = 24 WHERE logo_height <= 11",
  "ALTER TABLE shop_configs ADD COLUMN content_max_width integer DEFAULT 840 NOT NULL",
  "UPDATE shop_configs SET content_max_width = 840 WHERE content_max_width = 640",
  "UPDATE shop_configs SET logo_height = 28, gap = 32 WHERE logo_height = 22",
];

function isIgnorableMigrationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("duplicate column") || message.includes("already exists")
  );
}

const client = createClient(getTursoConfig());

for (const sql of MIGRATIONS) {
  try {
    await client.execute(sql);
    console.log(`Applied: ${sql}`);
  } catch (error) {
    if (isIgnorableMigrationError(error)) {
      console.log(`Skipped (exists): ${sql}`);
      continue;
    }

    throw error;
  }
}

console.log("Migrations complete.");
