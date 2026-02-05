import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, dependencies, tasks } from "@db/index";
import { eq, and } from "drizzle-orm";
import { detectCycle, getBlockers, getBlocking } from "../lib/dag";

const dependenciesRouter = new Hono();

// Validation schemas
const createDependencySchema = z.object({
  blockerId: z.string().uuid(),
  blockedId: z.string().uuid(),
});

// GET /api/dependencies/:taskId/blockers - What blocks this task?
dependenciesRouter.get("/:taskId/blockers", async (c) => {
  const taskId = c.req.param("taskId");
  
  const blockers = await getBlockers(taskId);
  
  return c.json(blockers);
});

// GET /api/dependencies/:taskId/blocking - What does this task block?
dependenciesRouter.get("/:taskId/blocking", async (c) => {
  const taskId = c.req.param("taskId");
  
  const blocking = await getBlocking(taskId);
  
  return c.json(blocking);
});

// POST /api/dependencies - Create dependency
dependenciesRouter.post("/", zValidator("json", createDependencySchema), async (c) => {
  const { blockerId, blockedId } = c.req.valid("json");
  
  // Can't depend on yourself
  if (blockerId === blockedId) {
    return c.json({ error: "A task cannot block itself" }, 400);
  }
  
  // Check both tasks exist
  const [blocker] = await db.select().from(tasks).where(eq(tasks.id, blockerId));
  const [blocked] = await db.select().from(tasks).where(eq(tasks.id, blockedId));
  
  if (!blocker || !blocked) {
    return c.json({ error: "One or both tasks not found" }, 404);
  }
  
  // Cycle detection: would adding this edge create a cycle?
  const wouldCycle = await detectCycle(blockerId, blockedId);
  
  if (wouldCycle) {
    return c.json({ 
      error: "This dependency would create a cycle",
      message: "Adding this dependency would create a circular dependency chain"
    }, 400);
  }
  
  // Create the dependency
  try {
    const [dependency] = await db
      .insert(dependencies)
      .values({ blockerId, blockedId })
      .returning();
    
    return c.json(dependency, 201);
  } catch (error: any) {
    // Handle duplicate
    if (error.code === "23505") {
      return c.json({ error: "Dependency already exists" }, 409);
    }
    throw error;
  }
});

// DELETE /api/dependencies - Remove dependency
dependenciesRouter.delete("/", zValidator("json", createDependencySchema), async (c) => {
  const { blockerId, blockedId } = c.req.valid("json");
  
  const [dependency] = await db
    .delete(dependencies)
    .where(
      and(
        eq(dependencies.blockerId, blockerId),
        eq(dependencies.blockedId, blockedId)
      )
    )
    .returning();
  
  if (!dependency) {
    return c.json({ error: "Dependency not found" }, 404);
  }
  
  return c.json({ deleted: true });
});

export { dependenciesRouter };
