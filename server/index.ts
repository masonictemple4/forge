import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { tasksRouter } from "./routes/tasks";
import { dependenciesRouter } from "./routes/dependencies";
import { boardsRouter } from "./routes/boards";
import { columnsRouter } from "./routes/columns";
import { authRouter } from "./routes/auth";

// Create Hono app for API routes
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
app.route("/columns", columnsRouter);

// Create auth app (not under /api prefix - OAuth callbacks need direct paths)
const authApp = new Hono().basePath("/auth");
authApp.use("*", logger());
authApp.route("/", authRouter);

// Export for integration with TanStack Start
export { app, authApp };
export type AppType = typeof app;
