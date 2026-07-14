/**
 * Websites taxonomy — public barrel. The service is split across cohesive siblings:
 * `websiteHelpers` (pure/leaf helpers + error classes), `websiteCrud` (reads/writes),
 * `websiteScan` (scan/scrape-observation side), and `websiteBoot` (boot/seed/migration steps).
 * This file re-exports the full public surface so `@/services/websites` keeps working unchanged.
 */
export * from "./websiteHelpers";
export * from "./websiteCrud";
export * from "./websiteScan";
export * from "./websiteBoot";
