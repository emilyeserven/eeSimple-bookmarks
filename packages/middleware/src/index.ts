import "dotenv/config";
import { buildApp } from "@/app";
import { maybeSeed } from "@/db/seed";
import { ensureAutofillConditions } from "@/services/autofill";
import { ensureDefaultCategory } from "@/services/categories";
import { ensureHomepageFilter } from "@/services/homepageFilter";
import { backfillWebsiteSlugs } from "@/services/websites";
import { ensureBucket, isObjectStoreConfigured } from "@/utils/objectStore";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

const app = await buildApp();

try {
  // Runs in every environment: guarantees the built-in "Default" category and
  // backfills any bookmarks left without a category.
  await ensureDefaultCategory();
  await backfillWebsiteSlugs();
  await maybeSeed();
  // Backfill condition trees for legacy autofill rules and seed the homepage filter from the
  // previous is-homepage / homepage-tags mechanism on first boot.
  await ensureAutofillConditions();
  await ensureHomepageFilter();
  // Create the image bucket if storage is configured; harmless when it already exists.
  if (isObjectStoreConfigured()) await ensureBucket();
}
catch (err) {
  app.log.warn({
    err,
  }, "Startup data step skipped (database not ready?)");
}

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
