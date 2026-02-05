/**
 * Database Seeding Script
 * 
 * Creates a demo board with:
 * - 5 columns (Backlog, Todo, In Progress, Review, Done)
 * - 25 sample tasks with varying priorities
 * - Dependency relationships between tasks
 * 
 * Usage: pnpm db:seed
 */

import { db, tasks, dependencies, type TaskStatus } from "../db";
// Simple inline rank generation (avoids module resolution issues)
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function initial(): string { return 'M'; }
function after(rank: string): string {
  const lastChar = rank[rank.length - 1];
  const idx = CHARS.indexOf(lastChar);
  if (idx < CHARS.length - 1) {
    return rank.slice(0, -1) + CHARS[idx + 1];
  }
  return rank + 'A';
}
import { sql } from "drizzle-orm";

// Task templates organized by status
const taskTemplates: Record<TaskStatus, { title: string; description: string }[]> = {
  backlog: [
    { title: "Research WebSocket integration", description: "Evaluate Socket.io vs native WebSockets for real-time collaboration" },
    { title: "Design notification system", description: "Create specs for in-app notifications and email digests" },
    { title: "Evaluate CRDT libraries", description: "Compare Yjs, Automerge, and other CRDT libs for text editing" },
    { title: "Plan mobile app architecture", description: "Define React Native vs Flutter approach" },
    { title: "Audit security requirements", description: "Review OWASP guidelines and plan implementation" },
    { title: "Research AI features", description: "Explore task auto-categorization and smart suggestions" },
  ],
  todo: [
    { title: "Implement user authentication", description: "Add login/signup with email and OAuth providers" },
    { title: "Create board management CRUD", description: "Allow users to create, edit, and delete boards" },
    { title: "Add file attachment support", description: "Enable uploading files to tasks (S3/R2 storage)" },
    { title: "Build task comment system", description: "Allow threaded comments on tasks" },
    { title: "Implement keyboard shortcuts", description: "Add vim-style navigation and common actions" },
  ],
  in_progress: [
    { title: "Optimize database queries", description: "Add missing indexes and optimize slow queries" },
    { title: "Build activity timeline", description: "Show task history and recent changes" },
    { title: "Add task labels/tags", description: "Implement color-coded labels for categorization" },
    { title: "Create task filters", description: "Filter by status, assignee, labels, and date range" },
    { title: "Implement search functionality", description: "Full-text search using PostgreSQL tsvector" },
  ],
  review: [
    { title: "Task priority system", description: "Add priority levels (P0-P3) with visual indicators" },
    { title: "Due date reminders", description: "Implement due date field with notification triggers" },
    { title: "Board templates", description: "Pre-built templates for common workflows" },
    { title: "Export to CSV/JSON", description: "Allow exporting board data for reporting" },
  ],
  done: [
    { title: "Set up TanStack Start", description: "Configure SSR, routing, and build pipeline" },
    { title: "Implement LexoRank ordering", description: "O(1) card reordering with fractional indexing" },
    { title: "Build DAG dependency system", description: "Task dependencies with cycle detection" },
    { title: "Create Kanban board UI", description: "Drag-and-drop board with virtualization" },
    { title: "Add optimistic updates", description: "Instant UI feedback with background sync" },
  ],
};

// Generate ranks for each status column
function generateRanks(count: number): string[] {
  const ranks: string[] = [];
  let current = initial();
  for (let i = 0; i < count; i++) {
    ranks.push(current);
    current = after(current);
  }
  return ranks;
}

// Dependency relationships (indices refer to task order across all statuses)
// Format: [blockerIndex, blockedIndex] - blocker must be done before blocked
const dependencyPairs = [
  // Auth must be done before comments
  [6, 9],    // "Implement user authentication" blocks "Build task comment system"
  // Search needs filters
  [13, 14],  // "Create task filters" blocks "Implement search functionality"
  // WebSocket research needed for real-time
  [0, 1],    // "Research WebSocket integration" blocks "Design notification system"
  // CRDT research needed for collaboration
  [2, 5],    // "Evaluate CRDT libraries" blocks "Research AI features"
  // Labels needed before templates
  [12, 17],  // "Add task labels/tags" blocks "Board templates"
  // Due dates needed for reminders
  [16, 15],  // Actually "Due date reminders" (16) needs "Task priority system" (15)
];

async function seed() {
  console.log("🌱 Starting database seed...\n");

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  await db.delete(dependencies);
  await db.delete(tasks);

  // Create tasks for each status
  const allTasks: { id: string; status: TaskStatus; title: string }[] = [];
  
  for (const [status, templates] of Object.entries(taskTemplates)) {
    const ranks = generateRanks(templates.length);
    
    console.log(`📋 Creating ${templates.length} tasks in "${status}"...`);
    
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      const [inserted] = await db
        .insert(tasks)
        .values({
          title: template.title,
          description: template.description,
          status: status as TaskStatus,
          rank: ranks[i],
          path: "/",
        })
        .returning({ id: tasks.id });
      
      allTasks.push({
        id: inserted.id,
        status: status as TaskStatus,
        title: template.title,
      });
    }
  }

  console.log(`\n✅ Created ${allTasks.length} tasks total`);

  // Create dependencies
  console.log("\n🔗 Creating task dependencies...");
  
  for (const [blockerIdx, blockedIdx] of dependencyPairs) {
    if (blockerIdx < allTasks.length && blockedIdx < allTasks.length) {
      const blocker = allTasks[blockerIdx];
      const blocked = allTasks[blockedIdx];
      
      await db.insert(dependencies).values({
        blockerId: blocker.id,
        blockedId: blocked.id,
      });
      
      console.log(`   "${blocker.title.slice(0, 30)}..." → blocks → "${blocked.title.slice(0, 30)}..."`);
    }
  }

  console.log(`\n✅ Created ${dependencyPairs.length} dependencies`);

  // Summary
  console.log("\n📊 Seed Summary:");
  console.log("─".repeat(40));
  
  for (const status of Object.keys(taskTemplates)) {
    const count = allTasks.filter(t => t.status === status).length;
    console.log(`   ${status.padEnd(12)} : ${count} tasks`);
  }
  
  console.log("─".repeat(40));
  console.log(`   Total tasks : ${allTasks.length}`);
  console.log(`   Dependencies: ${dependencyPairs.length}`);
  console.log("\n🎉 Seed complete! Run 'pnpm dev' to start the app.\n");

  process.exit(0);
}

// Run seed
seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
