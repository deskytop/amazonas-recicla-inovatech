import {
  pgTable,
  pgSchema,
  uuid,
  text,
  integer,
  timestamp,
  numeric,
  pgEnum,
  index,
  uniqueIndex,
  boolean,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";

// auth.users do Supabase — apenas referência, schema é gerenciado pelo Supabase
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const binStatus = pgEnum("bin_status", ["active", "maintenance", "full"]);
export const sessionStatus = pgEnum("session_status", [
  "awaiting_material",
  "material_detected",
  "completed",
  "expired",
  "failed",
]);
export const material = pgEnum("material", ["plastic", "metal", "glass", "paper"]);

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  level: integer("level").notNull().default(1),
  totalPoints: integer("total_points").notNull().default(0),
  lifetimePointsEarned: integer("lifetime_points_earned").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bins = pgTable(
  "bins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    locationName: text("location_name").notNull(),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    status: binStatus("status").notNull().default("active"),
    fillLevelPercent: integer("fill_level_percent").notNull().default(0),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    apiKeyHash: text("api_key_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    codeIdx: uniqueIndex("bins_code_idx").on(table.code),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull(),
    binId: uuid("bin_id")
      .notNull()
      .references(() => bins.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    material: material("material"),
    pointsValue: integer("points_value"),
    status: sessionStatus("status").notNull().default("awaiting_material"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    materialDetectedAt: timestamp("material_detected_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("sessions_token_idx").on(table.token),
    binStatusIdx: index("sessions_bin_status_idx").on(table.binId, table.status, table.createdAt),
    userCreatedIdx: index("sessions_user_created_idx").on(table.userId, table.createdAt),
  }),
);

// =============================================================================
// Fase 2: rewards, redemptions, missions, user_missions
// =============================================================================

export const rewardType = pgEnum("reward_type", [
  "digital_badge",
  "physical_item",
  "conversion",
]);

export const redemptionStatus = pgEnum("redemption_status", [
  "pending",
  "fulfilled",
  "cancelled",
]);

export const missionType = pgEnum("mission_type", [
  "daily",
  "weekly",
  "achievement",
]);

export const rewards = pgTable("rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  costPoints: integer("cost_points").notNull(),
  type: rewardType("type").notNull(),
  active: boolean("active").notNull().default(true),
  stock: integer("stock"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const redemptions = pgTable(
  "redemptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    rewardId: uuid("reward_id")
      .notNull()
      .references(() => rewards.id, { onDelete: "restrict" }),
    pointsSpent: integer("points_spent").notNull(),
    status: redemptionStatus("status").notNull().default("pending"),
    voucherCode: text("voucher_code"),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
  },
  (table) => ({
    userRedeemedIdx: index("redemptions_user_redeemed_idx").on(table.userId, table.redeemedAt),
  }),
);

export const missions = pgTable("missions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rewardPoints: integer("reward_points").notNull(),
  type: missionType("type").notNull(),
  condition: jsonb("condition").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userMissions = pgTable(
  "user_missions",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id, { onDelete: "cascade" }),
    periodKey: text("period_key").notNull(),
    progress: integer("progress").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.missionId, table.periodKey] }),
  }),
);
