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
  colorMode: text("color_mode").notNull().default("mono"),
  layout: text("layout").notNull().default("bar"),
  logoHeight: integer("logo_height").notNull().default(32),
  gap: integer("gap").notNull().default(24),
  alignment: text("alignment").notNull().default("center"),
  backgroundColor: text("background_color").notNull().default("transparent"),
  textColor: text("text_color").notNull().default("#111111"),
  borderRadius: integer("border_radius").notNull().default(0),
  paddingY: integer("padding_y").notNull().default(16),
  paddingX: integer("padding_x").notNull().default(16),
  marqueeSpeed: integer("marquee_speed").notNull().default(30),
  grayscaleOpacity: integer("grayscale_opacity").notNull().default(70),
  onboardingCompletedAt: text("onboarding_completed_at"),
  updatedAt: text("updated_at").notNull(),
});

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
