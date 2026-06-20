// eeSimple Bookmarks production gateway.
//
// A single Fastify entrypoint that:
//   1. applies the database schema on boot (runtime-migrations hook + drizzle-kit push),
//   2. spawns the middleware API as a child process and respawns it with backoff,
//   3. proxies `/api/*` to the middleware,
//   4. serves the client's static build (with SPA fallback),
//   5. exposes `/healthz` for orchestrators.
//
// The only configuration it needs in production is `DATABASE_URL`.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { connect } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import fastifyHttpProxy from "@fastify/http-proxy";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..", "..");
const middlewareDir = join(appRoot, "packages", "middleware");
const clientDist = join(appRoot, "packages", "client", "dist");

const GATEWAY_PORT = Number(process.env.PORT ?? 3000);
const MIDDLEWARE_PORT = Number(process.env.MIDDLEWARE_PORT ?? 3001);
const MIDDLEWARE_URL = `http://127.0.0.1:${MIDDLEWARE_PORT}`;

// How long to wait for the database to accept connections before giving up the
// boot, and how many times to retry the schema push once it is reachable.
const DB_WAIT_TIMEOUT_MS = Number(process.env.DB_WAIT_TIMEOUT_MS ?? 60_000);
const SCHEMA_PUSH_ATTEMPTS = Number(process.env.SCHEMA_PUSH_ATTEMPTS ?? 5);

// How long to wait for the middleware's /healthz to come up before starting the gateway anyway.
// Generous by default so modest hardware (e.g. a Raspberry Pi) has time to boot the API.
const MIDDLEWARE_WAIT_TIMEOUT_MS = Number(process.env.MIDDLEWARE_WAIT_TIMEOUT_MS ?? 60_000);

// Whether to proxy the Swagger/OpenAPI docs (`/docs`) through to the middleware. `DOCS_ENABLED`
// overrides explicitly (`true`/`1` on, `false`/`0` off); when unset it defaults to on outside
// production and off in production. The middleware parses this same flag the same way to decide
// whether to register the docs at all — keep the two in sync (see packages/middleware/src/app.ts).
function docsEnabled() {
  const flag = process.env.DOCS_ENABLED;
  if (flag === undefined || flag === "") return (process.env.NODE_ENV ?? "production") !== "production";
  return flag === "true" || flag === "1";
}
const DOCS_ENABLED = docsEnabled();

let middlewareChild = null;
let shuttingDown = false;
let restartDelay = 500;
const MAX_RESTART_DELAY = 16_000;

function binPath() {
  return [
    join(middlewareDir, "node_modules", ".bin"),
    join(appRoot, "node_modules", ".bin"),
    process.env.PATH ?? "",
  ].join(":");
}

/** Run a one-shot command and resolve with its exit code (never rejects). */
function runOnce(command, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      env: {
        ...process.env,
        PATH: binPath(),
      },
    });
    child.on("error", (err) => {
      console.error(`[gateway] "${command}" failed to start: ${err.message}`);
      resolve(1);
    });
    child.on("exit", code => resolve(code ?? 0));
  });
}

/** Parse DATABASE_URL into the host/port the schema push will connect to. */
function databaseEndpoint() {
  // Treat an empty string as "unset": drizzle.config.ts only falls back to
  // localhost when DATABASE_URL is null/undefined, so a blank value would
  // otherwise sail through and fail later with no explanation.
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 5432,
    };
  }
  catch {
    return null;
  }
}

/** Resolve true once a TCP connection to host:port succeeds, false otherwise. */
function probe(host, port) {
  return new Promise((resolve) => {
    const socket = connect({
      host,
      port,
    });
    const settle = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(3_000);
    socket.once("connect", () => settle(true));
    socket.once("error", () => settle(false));
    socket.once("timeout", () => settle(false));
  });
}

/** Poll until the database accepts a connection, or return false on timeout. */
async function waitForDatabase(host, port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let delay = 500;
  for (;;) {
    if (await probe(host, port)) return true;
    if (Date.now() >= deadline) return false;
    console.log(`[gateway] database at ${host}:${port} not ready; retrying in ${delay}ms…`);
    await new Promise(resolve => setTimeout(resolve, delay));
    delay = Math.min(delay * 2, 8_000);
  }
}

async function applySchema() {
  // The database is frequently not reachable the instant the gateway starts (a
  // managed Postgres still warming up, internal DNS not resolved yet). Without
  // this wait, drizzle-kit would exit non-zero, abort the boot, and crashloop
  // the deploy with no useful log — drizzle-kit swallows the connection error.
  const endpoint = databaseEndpoint();
  if (!endpoint) {
    console.error("[gateway] DATABASE_URL is unset or not a valid URL; cannot apply the schema. Set DATABASE_URL and redeploy.");
    process.exit(1);
  }

  console.log(`[gateway] waiting for database at ${endpoint.host}:${endpoint.port}…`);
  if (!(await waitForDatabase(endpoint.host, endpoint.port, DB_WAIT_TIMEOUT_MS))) {
    console.error(`[gateway] database at ${endpoint.host}:${endpoint.port} not reachable within ${DB_WAIT_TIMEOUT_MS}ms; aborting boot.`);
    process.exit(1);
  }

  // Apply the schema in two phases, mirroring the middleware's `push:prod` script (and course-tracker):
  //   1. Run the runtime-migrations hook (`dist/db/migrate.js`) — idempotent, imperative steps for
  //      the destructive / push-incompatible changes (DROP COLUMN, ALTER TYPE … ADD VALUE, data
  //      transforms). They run first so they remove anything destructive from the diff push computes
  //      next. (There are none yet, so this is a no-op until one is added.)
  //   2. `drizzle-kit push` reconciles the schema for every additive change (new tables/columns/
  //      constraints) by diffing schema.ts against the live database. Because step 1 keeps the diff
  //      additive, push never hits a data-loss change — so it needs no `--force` and won't block on
  //      an interactive prompt in this non-TTY deploy. (We deliberately do NOT pass `--force`: it
  //      does not suppress drizzle-kit's `pgSuggestions` truncation prompts anyway, and it would
  //      apply genuinely destructive diffs silently. Any NOT NULL column or unique constraint on a
  //      populated table MUST be pre-applied in step 1 so push's diff stays additive.)
  const migrateJs = join(middlewareDir, "dist", "db", "migrate.js");
  let delay = 1_000;
  for (let attempt = 1; ; attempt++) {
    console.log("[gateway] running database migrations…");
    let code = await runOnce(process.execPath, [migrateJs], middlewareDir);
    if (code === 0) {
      console.log("[gateway] applying schema (drizzle-kit push)…");
      code = await runOnce("drizzle-kit", ["push"], middlewareDir);
    }
    if (code === 0) return;
    // A broken schema apply only surfaces later as confusing per-query failures, so fail fast
    // and let the orchestrator restart the container — but retry a few times first to ride out
    // a database that accepted the TCP connection just before it was ready to serve queries.
    if (attempt >= SCHEMA_PUSH_ATTEMPTS) {
      console.error(`[gateway] schema apply failed (exit ${code}) after ${attempt} attempts; aborting boot.`);
      process.exit(1);
    }
    console.error(`[gateway] schema apply exited with ${code}; retrying (attempt ${attempt + 1}/${SCHEMA_PUSH_ATTEMPTS}) in ${delay}ms…`);
    await new Promise(resolve => setTimeout(resolve, delay));
    delay = Math.min(delay * 2, 8_000);
  }
}

function startMiddleware() {
  middlewareChild = spawn(process.execPath, [join(middlewareDir, "dist", "index.js")], {
    cwd: middlewareDir,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV ?? "production",
      PORT: String(MIDDLEWARE_PORT),
      HOST: "127.0.0.1",
    },
  });

  middlewareChild.on("exit", (code, signal) => {
    middlewareChild = null;
    if (shuttingDown) return;
    console.error(
      `[gateway] middleware exited (code=${code}, signal=${signal}); restarting in ${restartDelay}ms`,
    );
    setTimeout(startMiddleware, restartDelay);
    restartDelay = Math.min(restartDelay * 2, MAX_RESTART_DELAY);
  });

  // Reset the backoff once the process has stayed up for a while.
  setTimeout(() => {
    restartDelay = 500;
  }, 30_000);
}

async function waitForMiddleware(timeoutMs = MIDDLEWARE_WAIT_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${MIDDLEWARE_URL}/healthz`);
      if (res.ok) return true;
    }
    catch {
      // not up yet
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
}

async function startGateway() {
  const app = Fastify({
    logger: false,
  });

  await app.register(fastifyHttpProxy, {
    upstream: MIDDLEWARE_URL,
    prefix: "/api",
    rewritePrefix: "/api",
  });

  // Swagger UI lives on the middleware at `/docs` (HTML, `/docs/json`, `/docs/yaml`, `/docs/static/*`
  // all sit under that one prefix). It's only reachable through the gateway when we proxy it, and
  // only worth proxying when the middleware actually registered it — both are gated on DOCS_ENABLED.
  // Registering this proxy also means `/docs` no longer falls through to the SPA index.html below.
  if (DOCS_ENABLED) {
    await app.register(fastifyHttpProxy, {
      upstream: MIDDLEWARE_URL,
      prefix: "/docs",
      rewritePrefix: "/docs",
    });
  }

  app.get("/healthz", async () => ({
    status: "ok",
  }));

  if (existsSync(clientDist)) {
    await app.register(fastifyStatic, {
      root: clientDist,
      wildcard: false,
    });
    // SPA fallback: serve index.html for client-side routes.
    app.setNotFoundHandler((req, reply) => {
      if (req.method === "GET" && !req.url.startsWith("/api")) {
        return reply.sendFile("index.html");
      }
      return reply.code(404).send({
        message: "Not found",
      });
    });
  }
  else {
    console.warn(`[gateway] client build not found at ${clientDist} — serving API only.`);
  }

  await app.listen({
    port: GATEWAY_PORT,
    host: "0.0.0.0",
  });
  console.log(`[gateway] listening on http://0.0.0.0:${GATEWAY_PORT}`);
}

function shutdown(signal) {
  shuttingDown = true;
  if (middlewareChild) middlewareChild.kill(signal);
  process.exit(0);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(signal));
}

await applySchema();
startMiddleware();
if (await waitForMiddleware()) {
  console.log(`[gateway] middleware healthy at ${MIDDLEWARE_URL}`);
}
else {
  // Don't fail the boot — the gateway still serves the client and will proxy successfully once the
  // middleware recovers — but say so plainly. Until then, every `/api` request returns
  // `ECONNREFUSED ${MIDDLEWARE_PORT}`; the usual causes are the middleware crash-looping (look for
  // "[gateway] middleware exited" above — a SIGKILL there means it was out-of-memory killed) or a
  // boot step that never finished.
  console.error(
    `[gateway] middleware did not become healthy at ${MIDDLEWARE_URL} within ${MIDDLEWARE_WAIT_TIMEOUT_MS}ms; `
    + "/api requests will fail with ECONNREFUSED until it does. Check the middleware logs above.",
  );
}
await startGateway();
