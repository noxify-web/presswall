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
  "UPDATE shop_configs SET layout = 'bar' WHERE layout = 'slider'",
  "UPDATE shop_configs SET layout = 'bar' WHERE layout = 'grid'",
  `CREATE TABLE IF NOT EXISTS shop_custom_logos (
    id text PRIMARY KEY NOT NULL,
    shop text NOT NULL,
    name text NOT NULL,
    logo_svg text NOT NULL,
    created_at text NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS shop_custom_logos_shop_idx ON shop_custom_logos (shop)",
  "ALTER TABLE shop_publishers ADD COLUMN custom_logo_id text",
  "ALTER TABLE shop_custom_templates ADD COLUMN selections_json text DEFAULT '[]' NOT NULL",
  "ALTER TABLE shop_custom_templates ADD COLUMN is_default integer DEFAULT 0 NOT NULL",
  `CREATE TABLE IF NOT EXISTS shop_banner_assignments (
    id text PRIMARY KEY NOT NULL,
    shop text NOT NULL,
    target text NOT NULL,
    banner_id text NOT NULL,
    updated_at text NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS shop_banner_assignments_shop_idx ON shop_banner_assignments (shop)",
  "CREATE INDEX IF NOT EXISTS shop_banner_assignments_shop_target_idx ON shop_banner_assignments (shop, target)",
  `DELETE FROM shop_banner_assignments
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM shop_banner_assignments
      GROUP BY shop, target
    )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS shop_banner_assignments_shop_target_unique ON shop_banner_assignments (shop, target)",
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
