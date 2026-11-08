import "dotenv/config";
import { buildApp, docsEnabled } from "@/app";
import { ensureBucket, isObjectStoreConfigured } from "@/utils/objectStore";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

const app = await buildApp();

// Start listening BEFORE running the boot data-steps. The production gateway proxies `/api/*` to
// this process and waits on `/healthz`; if a boot step is slow or stalls (a sluggish database on
// modest hardware like a Raspberry Pi, a lock, etc.), blocking `listen` on it would leave the
// gateway unable to reach the upstream. Serving first keeps the API and health probe available;
// the idempotent steps below catch up.
try {
  await app.listen({
    port,
    host,
  });
  app.log.info(`API ready on http://${host}:${port}${docsEnabled() ? " (docs at /docs)" : ""}`);
}
catch (err) {
  app.log.error(err);
  process.exit(1);
}

try {
  // Boot data-steps: idempotent `ensure*` seeds and `backfill*` steps go here, in order.
  // Create the file bucket if storage is configured; harmless when it already exists.
  if (isObjectStoreConfigured()) await ensureBucket();
}
catch (err) {
  app.log.warn({
    err,
  }, "Startup data step skipped (dependency not ready?)");
}
