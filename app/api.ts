import {
  createStartAPIHandler,
  defaultAPIFileRouteHandler,
} from "@tanstack/react-start/api";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Import routers from server
import { tasksRouter } from "../server/routes/tasks";
import { dependenciesRouter } from "../server/routes/dependencies";
import { boardsRouter } from "../server/routes/boards";
import { columnsRouter } from "../server/routes/columns";
import { authRouter } from "../server/routes/auth";

// Create combined Hono app
const honoApp = new Hono();

// Middleware
honoApp.use("*", logger());
honoApp.use("*", cors());

// Health check
honoApp.get("/api/health", (c) => 
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

// Mount API routers
honoApp.route("/api/tasks", tasksRouter);
honoApp.route("/api/dependencies", dependenciesRouter);
honoApp.route("/api/boards", boardsRouter);
honoApp.route("/api/columns", columnsRouter);

// Mount auth router (at /auth, not /api/auth for cleaner OAuth callback URLs)
honoApp.route("/auth", authRouter);

// Also mount at /api/auth for consistency
honoApp.route("/api/auth", authRouter);

// Export the handler that TanStack Start expects
export default createStartAPIHandler(async ({ request }) => {
  // Try to handle with Hono first
  const url = new URL(request.url);

  console.log(`[api.ts] ${request.method} ${url.pathname}`);

  // Check if this is a Hono route
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return honoApp.fetch(request);
  }

  // Fall back to default file route handler
  return defaultAPIFileRouteHandler({ request });
});
