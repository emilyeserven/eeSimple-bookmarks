import "dotenv/config";
import { buildApp } from "@/app";
import { maybeSeed } from "@/db/seed";
import { ensureAutofillConditions, ensureAutofillSlugs } from "@/services/autofill";
import { ensureDefaultCategory } from "@/services/categories";
import { backfillCustomPropertySlugs } from "@/services/customProperties";
import { ensureHomepageFilter } from "@/services/homepageFilter";
import { backfillWebsiteSlugs } from "@/services/websites";
import { ensureBucket, isObjectStoreConfigured } from "@/utils/objectStore";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

const app = await buildApp();

// Start listening BEFORE running the boot data-steps. The production gateway proxies `/api/*` to
// this process and waits on `/healthz`; if a boot step is slow or stalls (a sluggish database on
// modest hardware, a lock, etc.), blocking `listen` on it would leave the gateway unable to reach
// the upstream — every `/api` request fails with `ECONNREFUSED 127.0.0.1:3001` until it finishes.
// Serving first keeps the API and health probe available; the idempotent steps below catch up.
try {
  await app.listen({
    port,
    host,
  });
  app.log.info(`eeSimple Bookmarks API ready on http://${host}:${port} (docs at /docs)`);
}
catch (err) {
  app.log.error(err);
  process.exit(1);
}

try {
  // Runs in every environment: guarantees the built-in "Default" category and
  // backfills any bookmarks left without a category.
  await ensureDefaultCategory();
  await backfillWebsiteSlugs();
  await backfillCustomPropertySlugs();
  await maybeSeed();
  // Backfill condition trees for legacy autofill rules and seed the homepage filter from the
  // previous is-homepage / homepage-tags mechanism on first boot.
  await ensureAutofillConditions();
  await ensureAutofillSlugs();
  await ensureHomepageFilter();
  // Create the image bucket if storage is configured; harmless when it already exists.
  if (isObjectStoreConfigured()) await ensureBucket();
}
catch (err) {
  app.log.warn({
    err,
  }, "Startup data step skipped (database not ready?)");
}
