import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  primaryKey,
  index,
  customType,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Custom tsvector type for PostgreSQL full-text search
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// Task status enum values
export const taskStatuses = ["backlog", "todo", "in_progress", "review", "done"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

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

// Type exports for use in API
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Dependency = typeof dependencies.$inferSelect;
export type NewDependency = typeof dependencies.$inferInsert;
