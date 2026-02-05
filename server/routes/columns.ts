import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, columns } from "@db/index";
import { eq, asc } from "drizzle-orm";
import { generateRank, generateRankBetween } from "../lib/lexorank";

const columnsRouter = new Hono();

// Validation schemas
const createColumnSchema = z.object({
  title: z.string().min(1).max(255),
  color: z.string().max(20).optional(),
  wipLimit: z.number().optional().transform(v => v?.toString()),
});

const updateColumnSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  color: z.string().max(20).optional(),
  wipLimit: z.number().optional().nullable().transform(v => v?.toString() ?? null),
});

const reorderSchema = z.object({
  beforeId: z.string().uuid().nullable(),
  afterId: z.string().uuid().nullable(),
});

// GET /api/columns - List all columns
columnsRouter.get("/", async (c) => {
  const result = await db
    .select()
    .from(columns)
    .orderBy(asc(columns.rank));

  return c.json(result);
});

// GET /api/columns/:id - Get single column
columnsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  
  const [column] = await db.select().from(columns).where(eq(columns.id, id));
  
  if (!column) {
    return c.json({ error: "Column not found" }, 404);
  }
  
  return c.json(column);
});

// POST /api/columns - Create column
columnsRouter.post("/", zValidator("json", createColumnSchema), async (c) => {
  const data = c.req.valid("json");
  
  // Generate rank at the end
  const existingColumns = await db
    .select({ rank: columns.rank })
    .from(columns)
    .orderBy(asc(columns.rank));
  
  let rank: string;
  if (existingColumns.length === 0) {
    rank = generateRank();
  } else {
    rank = generateRankBetween(existingColumns[existingColumns.length - 1].rank, null);
  }
  
  const [column] = await db
    .insert(columns)
    .values({
      title: data.title,
      color: data.color,
      rank,
      wipLimit: data.wipLimit,
    })
    .returning();
  
  return c.json(column, 201);
});

// PATCH /api/columns/:id - Update column (title, color, wipLimit)
columnsRouter.patch("/:id", zValidator("json", updateColumnSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");
  
  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.wipLimit !== undefined) updateData.wipLimit = data.wipLimit;
  
  const [column] = await db
    .update(columns)
    .set(updateData)
    .where(eq(columns.id, id))
    .returning();
  
  if (!column) {
    return c.json({ error: "Column not found" }, 404);
  }
  
  return c.json(column);
});

// POST /api/columns/:id/reorder - Reorder column (LexoRank)
columnsRouter.post("/:id/reorder", zValidator("json", reorderSchema), async (c) => {
  const id = c.req.param("id");
  const { beforeId, afterId } = c.req.valid("json");
  
  let beforeRank: string | null = null;
  let afterRank: string | null = null;
  
  if (beforeId) {
    const [before] = await db.select({ rank: columns.rank }).from(columns).where(eq(columns.id, beforeId));
    beforeRank = before?.rank ?? null;
  }
  
  if (afterId) {
    const [after] = await db.select({ rank: columns.rank }).from(columns).where(eq(columns.id, afterId));
    afterRank = after?.rank ?? null;
  }
  
  const newRank = generateRankBetween(afterRank, beforeRank);
  
  const [column] = await db
    .update(columns)
    .set({ rank: newRank, updatedAt: new Date() })
    .where(eq(columns.id, id))
    .returning();
  
  if (!column) {
    return c.json({ error: "Column not found" }, 404);
  }
  
  return c.json(column);
});

// DELETE /api/columns/:id - Delete column
columnsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  
  const [column] = await db.delete(columns).where(eq(columns.id, id)).returning();
  
  if (!column) {
    return c.json({ error: "Column not found" }, 404);
  }
  
  return c.json({ deleted: true });
});

export { columnsRouter };
