import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  primaryKey,
  index,
  customType,
  boolean,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Custom tsvector type for PostgreSQL full-text search
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// OAuth provider enum values
export const oauthProviders = ["github", "google", "apple"] as const;
export type OAuthProvider = (typeof oauthProviders)[number];

// Task status enum values
export const taskStatuses = ["backlog", "todo", "in_progress", "review", "done"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

/**
 * Users Table
 * 
 * Supports both OAuth and email/password authentication:
 * - OAuth users: provider + providerId fields set, passwordHash null
 * - Email/password users: provider = 'email', passwordHash set
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    
    // Profile
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    avatarUrl: text("avatar_url"),
    
    // Auth provider info
    provider: varchar("provider", { length: 20 }).notNull(), // github, google, apple, email
    providerId: varchar("provider_id", { length: 255 }), // ID from OAuth provider (null for email auth)
    
    // Email/password auth fields
    passwordHash: text("password_hash"), // Argon2 hash (null for OAuth users)
    emailVerified: boolean("email_verified").notNull().default(false),
    verificationToken: varchar("verification_token", { length: 255 }), // For email verification
    
    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint: one account per provider+providerId combo (for OAuth)
    index("users_provider_provider_id_idx").on(table.provider, table.providerId),
    // Index for email lookups (unique for email provider)
    index("users_email_idx").on(table.email),
    // Index for verification token lookups
    index("users_verification_token_idx").on(table.verificationToken),
  ]
);

/**
 * Sessions Table
 * 
 * User sessions with JWT tokens
 */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    
    // User reference
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    
    // JWT token (hashed for security in production, raw here for simplicity)
    token: text("token").notNull().unique(),
    
    // Expiration
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    
    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Index for token lookups
    index("sessions_token_idx").on(table.token),
    // Index for user's sessions
    index("sessions_user_id_idx").on(table.userId),
    // Index for cleanup of expired sessions
    index("sessions_expires_at_idx").on(table.expiresAt),
  ]
);

// Relations for users and sessions
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Type exports for users and sessions
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

/**
 * Tasks Table
 * 
 * Core entity with:
 * - LexoRank for O(1) reordering within status columns
 * - Materialized path for hierarchical queries (epics → stories → subtasks)
 * - tsvector for full-text search without external engine
 */
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    
    // Content
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    
    // LexoRank for O(1) reordering
    // String-based ranking: inserting between 'a' and 'b' yields 'an'
    rank: varchar("rank", { length: 255 }).notNull(),
    
    // Materialized path for hierarchy: '/uuid1/uuid2/uuid3/'
    // Enables instant subtree queries: WHERE path LIKE '/parent_id/%'
    path: text("path").notNull().default("/"),
    
    // Kanban status
    status: varchar("status", { length: 20 }).notNull().default("backlog"),
    
    // Full-text search vector
    // Updated via trigger: to_tsvector('english', title || ' ' || coalesce(description, ''))
    searchVector: tsvector("search_vector"),
    
    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Index for ordering within status columns
    index("tasks_status_rank_idx").on(table.status, table.rank),
    
    // B-Tree index for hierarchical queries using LIKE 'path%'
    // Using text_pattern_ops for efficient prefix matching
    index("tasks_path_idx").using("btree", sql`${table.path} text_pattern_ops`),
    
    // GIN index for full-text search
    index("tasks_search_idx").using("gin", table.searchVector),
  ]
);

/**
 * Dependencies Table (DAG edges)
 * 
 * Models task dependencies as directed edges.
 * Cycle detection handled in application layer (DFS).
 */
export const dependencies = pgTable(
  "dependencies",
  {
    // The task that blocks another
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    
    // The task that is blocked
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Composite primary key: each dependency is unique
    primaryKey({ columns: [table.blockerId, table.blockedId] }),
    
    // Index for "what blocks this task?"
    index("dependencies_blocked_idx").on(table.blockedId),
  ]
);

// Relations for type-safe queries
export const tasksRelations = relations(tasks, ({ many }) => ({
  // Tasks that this task blocks
  blocking: many(dependencies, { relationName: "blocker" }),
  // Tasks that block this task
  blockedBy: many(dependencies, { relationName: "blocked" }),
}));

export const dependenciesRelations = relations(dependencies, ({ one }) => ({
  blocker: one(tasks, {
    fields: [dependencies.blockerId],
    references: [tasks.id],
    relationName: "blocker",
  }),
  blocked: one(tasks, {
    fields: [dependencies.blockedId],
    references: [tasks.id],
    relationName: "blocked",
  }),
}));

/**
 * Columns Table
 * 
 * Custom kanban columns with:
 * - LexoRank for O(1) reordering
 * - Color and display customization
 * - Optional WIP limits
 */
export const columns = pgTable(
  "columns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    
    // Display
    title: varchar("title", { length: 255 }).notNull(),
    color: varchar("color", { length: 20 }),
    
    // LexoRank for ordering
    rank: varchar("rank", { length: 255 }).notNull(),
    
    // Optional WIP limit
    wipLimit: varchar("wip_limit", { length: 10 }),
    
    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("columns_rank_idx").on(table.rank),
  ]
);

// Type exports for use in API
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Dependency = typeof dependencies.$inferSelect;
export type NewDependency = typeof dependencies.$inferInsert;
export type Column = typeof columns.$inferSelect;
export type NewColumn = typeof columns.$inferInsert;
