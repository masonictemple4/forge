import { Hono } from "hono";
import { db, tasks, taskStatuses, type TaskStatus } from "@db/index";
import { asc } from "drizzle-orm";

const boardsRouter = new Hono();

// Column display configuration
const columnConfig: Record<TaskStatus, { title: string; color: string }> = {
  backlog: { title: "Backlog", color: "#6366f1" },
  todo: { title: "To Do", color: "#3b82f6" },
  in_progress: { title: "In Progress", color: "#f59e0b" },
  review: { title: "Review", color: "#8b5cf6" },
  done: { title: "Done", color: "#22c55e" },
};

// GET /api/boards/:id - Fetch board with columns and tasks
boardsRouter.get("/:id", async (c) => {
  const boardId = c.req.param("id");
  
  // Fetch all tasks ordered by rank
  const allTasks = await db
    .select()
    .from(tasks)
    .orderBy(asc(tasks.rank));
  
  // Group tasks by status into columns
  const tasksByStatus = new Map<TaskStatus, typeof allTasks>();
  
  for (const status of taskStatuses) {
    tasksByStatus.set(status, []);
  }
  
  for (const task of allTasks) {
    const status = task.status as TaskStatus;
    const statusTasks = tasksByStatus.get(status) ?? [];
    statusTasks.push(task);
    tasksByStatus.set(status, statusTasks);
  }
  
  // Build columns array
  const columns = taskStatuses.map((status) => {
    const config = columnConfig[status];
    return {
      id: status,
      title: config.title,
      color: config.color,
      tasks: tasksByStatus.get(status) ?? [],
    };
  });
  
  return c.json({
    id: boardId,
    name: "Project Board",
    columns,
  });
});

export { boardsRouter };
