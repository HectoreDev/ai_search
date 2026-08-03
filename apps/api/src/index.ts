import { Hono } from "hono";
import { cors } from "hono/cors";
import { chatRoutes } from "./routes/chat";
import { plansRoutes } from "./routes/plans";
import type { Bindings } from "./types";

const app = new Hono<{ Bindings: Bindings }>();
app.use("*", cors());
app.get("/api/health", (c) => c.json({ ok: true }));
app.route("/api/plans", plansRoutes);
app.route("/api/chat", chatRoutes);
app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
