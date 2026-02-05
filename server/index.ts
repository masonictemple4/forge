import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { tasksRouter } from "./routes/tasks";
import { dependenciesRouter } from "./routes/dependencies";
import { boardsRouter } from "./routes/boards";

// Create Hono app
const app = new Hono().basePath("/api");

// Middleware
app.use("*", logger());
app.use("*", cors());

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Mount routers
app.route("/tasks", tasksRouter);
app.route("/dependencies", dependenciesRouter);
app.route("/boards", boardsRouter);

// Export for integration with TanStack Start
export { app };
export type AppType = typeof app;
