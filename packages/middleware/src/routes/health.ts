import type { FastifyInstance } from "fastify";

/** Liveness probe used by the gateway and container orchestrators. */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  const handler = async () => ({
    status: "ok",
  });
  const schema = {
    tags: ["health"],
  };

  // /healthz — probed directly by the gateway's waitForMiddleware() at the middleware's port.
  app.get("/healthz", {
    schema,
  }, handler);
  // /api/healthz — probed by the client (via the Vite dev proxy or the gateway's /api proxy).
  // The client can't reach /healthz directly (neither the Vite proxy nor the gateway proxy exposes
  // it to the browser), so this route makes the client probe resolve to a 200 instead of 404.
  app.get("/api/healthz", {
    schema,
  }, handler);
}
