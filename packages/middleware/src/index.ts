import "dotenv/config";
import { buildApp, docsEnabled } from "@/app";
import { maybeSeed } from "@/db/seed";
import { ensureAppSettings, ensureDefaultPlaceTypeLevelGroups } from "@/services/appSettings";
import { backfillAuthorSlugs } from "@/services/authors";
import { backfillPublisherSlugs } from "@/services/publishers";
import { ensureAutofillConditions, ensureAutofillSlugs, ensureWebsiteConditions } from "@/services/autofill";
import { backfillCardDisplayRuleFieldZones, backfillCardDisplayRuleHeaderFields, backfillCardDisplayRuleLocationsField, backfillCardDisplayRuleSlugs, backfillCardDisplayRuleSubZones, backfillCardDisplayRuleZoneLayouts, ensureDefaultCardDisplayRule } from "@/services/cardDisplayRules";
import { ensureDefaultCategory } from "@/services/categories";
import { backfillContentStatusOptions, backfillCustomPropertySlugs, ensureChaptersProperty, ensureContentStatusProperty, ensureDatePostedProperty, ensureIsbnProperty, ensurePageProgressProperty, ensurePageRangeProperty, ensurePageSectionsProperty, ensureRuntimeProperty, ensureUrlSectionsProperty } from "@/services/customProperties";
import { ensureHomepageFilter } from "@/services/homepageFilter";
import { resetStalledImports } from "@/services/imports";
import { ensureImportRuleSlugs } from "@/services/importRules";
import { backfillImageCropModes, ensureHomepageSections } from "@/services/homepageSections";
import { backfillMediaTypeSlugs, ensureBuiltInMediaTypes } from "@/services/mediaTypes";
import { backfillPropertyGroupSlugs } from "@/services/propertyGroups";
import { backfillSavedFilterSlugs } from "@/services/savedFilters";
import { ensureBuiltInRelationshipTypes } from "@/services/relationshipTypes";
import { backfillTagSlugs } from "@/services/tags";
import { backfillLocationRomanizedSlugs, backfillLocationSlugs } from "@/services/locations";
import { backfillWebsiteSlugs, ensureBuiltInWebsites } from "@/services/websites";
import { backfillYouTubeChannelSlugs } from "@/services/youtubeChannels";
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
  // Runs in every environment: guarantees the built-in "Default" category.
  // Default also backfills any bookmarks left without a category.
  await ensureDefaultCategory();
  await ensureAppSettings();
  await ensureBuiltInWebsites();
  await backfillWebsiteSlugs();
  await backfillCustomPropertySlugs();
  await ensureDatePostedProperty();
  await ensureContentStatusProperty();
  await backfillContentStatusOptions();
  await ensureBuiltInMediaTypes();
  await backfillMediaTypeSlugs();
  await backfillPublisherSlugs();
  await ensureRuntimeProperty();
  await ensurePageProgressProperty();
  await ensurePageRangeProperty();
  await ensureChaptersProperty();
  await ensurePageSectionsProperty();
  await ensureUrlSectionsProperty();
  await ensureIsbnProperty();
  await backfillPropertyGroupSlugs();
  await backfillSavedFilterSlugs();
  await ensureBuiltInRelationshipTypes();
  await backfillYouTubeChannelSlugs();
  await backfillTagSlugs();
  await backfillLocationSlugs();
  await backfillLocationRomanizedSlugs();
  await ensureDefaultPlaceTypeLevelGroups();
  await backfillAuthorSlugs();
  await maybeSeed();
  // Backfill condition trees for legacy autofill rules and seed the homepage filter from the
  // previous is-homepage / homepage-tags mechanism on first boot.
  await ensureAutofillConditions();
  await ensureWebsiteConditions();
  await ensureAutofillSlugs();
  await ensureImportRuleSlugs();
  await ensureHomepageFilter();
  await ensureHomepageSections();
  await backfillImageCropModes();
  await ensureDefaultCardDisplayRule();
  await backfillCardDisplayRuleFieldZones();
  await backfillCardDisplayRuleSubZones();
  await backfillCardDisplayRuleHeaderFields();
  await backfillCardDisplayRuleLocationsField();
  await backfillCardDisplayRuleZoneLayouts();
  await backfillCardDisplayRuleSlugs();
  // A restart abandons any in-process import worker, so fail anything left queued/processing.
  await resetStalledImports();
  // Create the image bucket if storage is configured; harmless when it already exists.
  if (isObjectStoreConfigured()) await ensureBucket();
}
catch (err) {
  app.log.warn({
    err,
  }, "Startup data step skipped (database not ready?)");
}
