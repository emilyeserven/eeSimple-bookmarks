import "dotenv/config";
import { buildApp, docsEnabled } from "@/app";
import { maybeSeed } from "@/db/seed";
import { ensureAppSettings, ensureDefaultPlaceTypeLevelGroups } from "@/services/appSettings";
import { ensureDefaultGroupTypes } from "@/services/groupTypes";
import { backfillCardDisplaySections, deleteNonDefaultCardDisplayRules, ensureCardDisplayConfig } from "@/services/cardDisplayRules";
import { ensureDefaultCategory } from "@/services/categories";
import { ensureContentStatusProperty, ensureDatePostedProperty, ensureFillInStatusProperty, ensureIsbnProperty, ensurePageRangeProperty, ensureProgressProperty, ensureRuntimeProperty, ensureSectionsProperty } from "@/services/customProperties";
import { ensureHomepageFilter } from "@/services/homepageFilter";
import { findInvalidEntityLayouts } from "@/services/entityLayouts";
import { resetStalledImports } from "@/services/imports";
import { resetStalledReelArchiveJobs } from "@/services/reelArchive";
import { ensureHomepageSections } from "@/services/homepageSections";
import { ensureBuiltInMediaTypes } from "@/services/mediaTypes";
import { ensureBuiltInLanguages } from "@/services/languages";
import { ensureBuiltInLanguageUsageLevels } from "@/services/languageUsageLevels";
import { ensureBuiltInTranslationSources } from "@/services/translationSources";
import { ensureBuiltInRelationshipTypes } from "@/services/relationshipTypes";
import { ensureDefaultLocationRelations } from "@/services/locationRelations";
import { backfillExtensionFillPathMatch, ensureBuiltInWebsites } from "@/services/websites";
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
  app.log.info(
    `eeSimple Bookmarks API ready on http://${host}:${port}${docsEnabled() ? " (docs at /docs)" : ""}`,
  );
}
catch (err) {
  app.log.error(err);
  process.exit(1);
}

try {
  // Seeds only (`ensure*`): a fresh install needs each of these; every one is idempotent and
  // re-runs as a no-op. The one-time `backfill*` steps were retired in issue #862 (the single
  // production deployment is fully migrated, and create paths now always write the field).
  // Runs in every environment: guarantees the built-in "Default" category, backfilling any
  // bookmarks left without one.
  await ensureDefaultCategory();
  await ensureAppSettings();
  await ensureBuiltInWebsites();
  await backfillExtensionFillPathMatch();
  await ensureDatePostedProperty();
  await ensureContentStatusProperty();
  await ensureFillInStatusProperty();
  await ensureBuiltInMediaTypes();
  await ensureBuiltInLanguages();
  await ensureBuiltInLanguageUsageLevels();
  await ensureBuiltInTranslationSources();
  await ensureDefaultGroupTypes();
  await ensureRuntimeProperty();
  // Sections must be seeded before Progress: a fresh install's Progress derives from Sections
  // completion, so the seed links itemInItemsSourcePropertyId to the Sections property id.
  const sectionsPropertyId = await ensureSectionsProperty();
  await ensureProgressProperty(sectionsPropertyId);
  await ensurePageRangeProperty();
  await ensureIsbnProperty();
  await ensureBuiltInRelationshipTypes();
  await ensureDefaultLocationRelations();
  await ensureDefaultPlaceTypeLevelGroups();
  await maybeSeed();
  await ensureHomepageFilter();
  await ensureHomepageSections();
  await ensureCardDisplayConfig();
  await backfillCardDisplaySections();
  await deleteNonDefaultCardDisplayRules();
  // Integrity check (log-only): surface any structurally-invalid stored page layout loudly instead of
  // silently healing it. The rows are kept (not deleted) so the user can inspect/resolve each in
  // Settings → Advanced → Layout Issues; logging the reasons puts the debug info in the server logs too.
  const invalidLayouts = await findInvalidEntityLayouts();
  if (invalidLayouts.length > 0) {
    app.log.warn({
      invalidLayouts,
    }, "Invalid stored entity layouts detected; they resolve to defaults and are surfaced in Settings → Advanced → Layout Issues");
  }
  // A restart abandons any in-process import worker, so fail anything left queued/processing.
  await resetStalledImports();
  await resetStalledReelArchiveJobs();
  // Create the image bucket if storage is configured; harmless when it already exists.
  if (isObjectStoreConfigured()) await ensureBucket();
}
catch (err) {
  app.log.warn({
    err,
  }, "Startup data step skipped (database not ready?)");
}
