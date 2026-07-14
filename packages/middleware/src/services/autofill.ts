/**
 * Autofill service — pure barrel. Logic lives in the sibling modules:
 * - `./autofillRules` — rule CRUD, read-hydration, value writers, slug helpers.
 * - `./autofillEval` — matching a bookmark/condition tree against rules (`suggestAutofillForBookmark`,
 *   `previewAutofillMatches`).
 * - `./autofillBackfill` — backfilling existing bookmarks against a rule (has the sole
 *   `invalidateBookmarkCache()` call for this feature).
 */
export * from "./autofillRules";
export * from "./autofillEval";
export * from "./autofillBackfill";
