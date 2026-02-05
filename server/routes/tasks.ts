import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, tasks, taskStatuses } from "@db/index";
import { eq, sql, like, and, asc } from "drizzle-orm";
import { generateRank, generateRankBetween } from "../lib/lexorank";

const tasksRouter = new Hono();

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(taskStatuses).default("backlog"),
  parentId: z.string().uuid().optional(), // For hierarchy
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(taskStatuses).optional(),
  rank: z.string().optional(),
  path: z.string().optional(),
});

const reorderSchema = z.object({
  beforeId: z.string().uuid().nullable(),
  afterId: z.string().uuid().nullable(),
});

const moveTaskSchema = z.object({
  targetStatus: z.enum(taskStatuses),
  beforeId: z.string().uuid().nullable(),
  afterId: z.string().uuid().nullable(),
});

// GET /api/tasks - List all tasks
tasksRouter.get("/", async (c) => {
  const status = c.req.query("status");
  const parentPath = c.req.query("parentPath");
  const search = c.req.query("q");

  let query = db.select().from(tasks);

  const conditions = [];

  if (status) {
    conditions.push(eq(tasks.status, status));
  }

  if (parentPath) {
    // Get all descendants of a parent
    conditions.push(like(tasks.path, `${parentPath}%`));
  }

  if (search) {
    // Full-text search using tsvector
    conditions.push(
      sql`${tasks.searchVector} @@ plainto_tsquery('english', ${search})`
    );
  }

  const result = await db
    .select()
    .from(tasks)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(tasks.rank));

  return c.json(result);
});

// GET /api/tasks/:id - Get single task
tasksRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }
  
  return c.json(task);
});

// POST /api/tasks - Create task
tasksRouter.post("/", zValidator("json", createTaskSchema), async (c) => {
  const data = c.req.valid("json");
  
  // Generate initial rank (at the end of the list)
  const rank = generateRank();
  
  // Determine path based on parent
  let path = "/";
  if (data.parentId) {
    const [parent] = await db.select().from(tasks).where(eq(tasks.id, data.parentId));
    if (parent) {
      path = `${parent.path}${parent.id}/`;
    }
  }
  
  const [task] = await db
    .insert(tasks)
    .values({
      title: data.title,
      description: data.description,
      status: data.status,
      rank,
      path,
    })
    .returning();
  
  // Update search vector
  await db.execute(sql`
    UPDATE tasks 
    SET search_vector = to_tsvector('english', ${task.title} || ' ' || COALESCE(${task.description}, ''))
    WHERE id = ${task.id}
  `);
  
  return c.json(task, 201);
});

// PATCH /api/tasks/:id - Update task
tasksRouter.patch("/:id", zValidator("json", updateTaskSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");
  
  const [task] = await db
    .update(tasks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();
  
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }
  
  // Update search vector if title/description changed
  if (data.title || data.description !== undefined) {
    await db.execute(sql`
      UPDATE tasks 
      SET search_vector = to_tsvector('english', ${task.title} || ' ' || COALESCE(${task.description}, ''))
      WHERE id = ${task.id}
    `);
  }
  
  return c.json(task);
});

// POST /api/tasks/:id/reorder - Reorder task (LexoRank)
tasksRouter.post("/:id/reorder", zValidator("json", reorderSchema), async (c) => {
  const id = c.req.param("id");
  const { beforeId, afterId } = c.req.valid("json");
  
  let beforeRank: string | null = null;
  let afterRank: string | null = null;
  
  if (beforeId) {
    const [before] = await db.select({ rank: tasks.rank }).from(tasks).where(eq(tasks.id, beforeId));
    beforeRank = before?.rank ?? null;
  }
  
  if (afterId) {
    const [after] = await db.select({ rank: tasks.rank }).from(tasks).where(eq(tasks.id, afterId));
    afterRank = after?.rank ?? null;
  }
  
  const newRank = generateRankBetween(beforeRank, afterRank);
  
  const [task] = await db
    .update(tasks)
    .set({ rank: newRank, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();
  
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }
  
  return c.json(task);
});

// POST /api/tasks/:id/move - Move task to different column/position
tasksRouter.post("/:id/move", zValidator("json", moveTaskSchema), async (c) => {
  const id = c.req.param("id");
  const { targetStatus, beforeId, afterId } = c.req.valid("json");
  
  // Get the task to move
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }
  
  // Calculate new rank based on surrounding tasks
  let beforeRank: string | null = null;
  let afterRank: string | null = null;
  
  if (beforeId) {
    const [before] = await db.select({ rank: tasks.rank }).from(tasks).where(eq(tasks.id, beforeId));
    beforeRank = before?.rank ?? null;
  }
  
  if (afterId) {
    const [after] = await db.select({ rank: tasks.rank }).from(tasks).where(eq(tasks.id, afterId));
    afterRank = after?.rank ?? null;
  }
  
  // If neither before nor after specified, add to end of target column
  if (!beforeId && !afterId) {
    const [lastTask] = await db
      .select({ rank: tasks.rank })
      .from(tasks)
      .where(eq(tasks.status, targetStatus))
      .orderBy(sql`${tasks.rank} DESC`)
      .limit(1);
    
    if (lastTask) {
      afterRank = lastTask.rank;
    }
  }
  
  const newRank = generateRankBetween(afterRank, beforeRank);
  
  // Update task with new status and rank
  const [updated] = await db
    .update(tasks)
    .set({ 
      status: targetStatus, 
      rank: newRank, 
      updatedAt: new Date() 
    })
    .where(eq(tasks.id, id))
    .returning();
  
  return c.json(updated);
});

// DELETE /api/tasks/:id - Delete task
tasksRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  
  const [task] = await db.delete(tasks).where(eq(tasks.id, id)).returning();
  
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }
  
  return c.json({ deleted: true });
});

export { tasksRouter };
