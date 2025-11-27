import { index, int, longtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Subscription plans and billing
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  plan: mysqlEnum("plan", ["free", "pro"]).default("free").notNull(),
  status: mysqlEnum("status", ["active", "canceled", "past_due", "trialing"]).default("active").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: int("cancelAtPeriodEnd").default(0).notNull(), // boolean as int
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * User credits for AI usage
 */
export const credits = mysqlTable("credits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  remaining: int("remaining").default(10).notNull(), // Free tier gets 10/day
  total: int("total").default(10).notNull(), // Total credits for current period
  resetDate: timestamp("resetDate").notNull(), // When credits reset (daily for free, monthly for pro)
  plan: mysqlEnum("plan", ["free", "pro"]).default("free").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Credits = typeof credits.$inferSelect;
export type InsertCredits = typeof credits.$inferInsert;

/**
 * Usage logs for analytics and billing
 */
export const usageLogs = mysqlTable("usage_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: mysqlEnum("action", ["ai_message", "code_execution", "file_operation"]).notNull(),
  creditsUsed: int("creditsUsed").default(1).notNull(),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = typeof usageLogs.$inferInsert;

/**
 * User's code generation projects
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  /** S3 file key for project files */
  filesKey: varchar("filesKey", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Conversations table - stores AI chat sessions for each project
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages table - stores individual messages in conversations
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: longtext("content").notNull(), // LONGTEXT for large AI responses (4GB limit)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index("conversationId_idx").on(table.conversationId),
}));

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Files table - stores metadata for project files (actual content in S3)
 */
export const files = mysqlTable("files", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  /** File path within the project */
  path: varchar("path", { length: 512 }).notNull(),
  /** S3 file key */
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  /** S3 URL */
  url: text("url").notNull(),
  mimeType: varchar("mimeType", { length: 128 }),
  size: int("size"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type File = typeof files.$inferSelect;
export type InsertFile = typeof files.$inferInsert;