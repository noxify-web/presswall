import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("Session", {
  id: text("id").primaryKey(),
  shop: text("shop").notNull(),
  state: text("state").notNull(),
  isOnline: integer("isOnline", { mode: "boolean" }).notNull().default(false),
  scope: text("scope"),
  expires: text("expires"),
  accessToken: text("accessToken").notNull(),
  userId: text("userId"),
  firstName: text("firstName"),
  lastName: text("lastName"),
  email: text("email"),
  accountOwner: integer("accountOwner", { mode: "boolean" }),
  locale: text("locale"),
  collaborator: integer("collaborator", { mode: "boolean" }),
  emailVerified: integer("emailVerified", { mode: "boolean" }),
  refreshToken: text("refreshToken"),
  refreshTokenExpires: text("refreshTokenExpires"),
});

export const publishers = sqliteTable("publishers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  logoSvg: text("logoSvg").notNull(),
  logoMonoSvg: text("logoMonoSvg").notNull(),
  websiteUrl: text("websiteUrl"),
  sortOrder: integer("sortOrder").notNull().default(0),
});

export const shopConfigs = sqliteTable("shop_configs", {
  shop: text("shop").primaryKey(),
  headingText: text("heading_text").notNull().default("As seen on"),
  showHeading: integer("show_heading", { mode: "boolean" })
    .notNull()
    .default(true),
  headingFontSize: integer("heading_font_size").notNull().default(12),
  headingSpacing: integer("heading_spacing").notNull().default(40),
  colorMode: text("color_mode").notNull().default("mono"),
  layout: text("layout").notNull().default("bar"),
  logoHeight: integer("logo_height").notNull().default(28),
  logosPerRowDesktop: integer("logos_per_row").notNull().default(4),
  logosPerRowMobile: integer("logos_per_row_mobile").notNull().default(2),
  gap: integer("gap").notNull().default(32),
  logoSpacing: text("logo_spacing").notNull().default("space-between"),
  headingAlignment: text("alignment").notNull().default("center"),
  logoAlignment: text("logo_alignment").notNull().default("center"),
  backgroundColor: text("background_color").notNull().default("transparent"),
  textColor: text("text_color").notNull().default("#111111"),
  borderRadius: integer("border_radius").notNull().default(0),
  paddingY: integer("padding_y").notNull().default(40),
  paddingX: integer("padding_x").notNull().default(24),
  contentMaxWidth: integer("content_max_width").notNull().default(840),
  marqueeSpeed: integer("marquee_speed").notNull().default(30),
  grayscaleOpacity: integer("grayscale_opacity").notNull().default(70),
  onboardingCompletedAt: text("onboarding_completed_at"),
  updatedAt: text("updated_at").notNull(),
});

export const shopCustomTemplates = sqliteTable(
  "shop_custom_templates",
  {
    id: text("id").primaryKey(),
    shop: text("shop").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    configJson: text("config_json").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    shopIdx: index("shop_custom_templates_shop_idx").on(table.shop),
  })
);

export const shopPublishers = sqliteTable(
  "shop_publishers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    shop: text("shop").notNull(),
    publisherId: text("publisher_id"),
    customName: text("custom_name"),
    customLogoSvg: text("custom_logo_svg"),
    customUrl: text("custom_url"),
    position: integer("position").notNull(),
  },
  (table) => ({
    shopIdx: index("shop_publishers_shop_idx").on(table.shop),
  })
);
