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
app.use("*", cors({
  origin: process.env.NODE_ENV === "production" 
    ? (process.env.CORS_ORIGIN || "https://forge.app") 
    : "http://localhost:3000",
  credentials: true,
}));

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Mount routers
app.route("/auth", authRouter);
app.route("/tasks", tasksRouter);
app.route("/dependencies", dependenciesRouter);
app.route("/boards", boardsRouter);
app.route("/columns", columnsRouter);

// Export for integration with TanStack Start
export { app };
export type AppType = typeof app;
