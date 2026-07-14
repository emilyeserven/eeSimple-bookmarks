import { asc } from "drizzle-orm";
import type {
  AutofillPreviewEntry,
  AutofillPreviewInput,
  AutofillPreviewResult,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
} from "@eesimple/types";
import { evaluateConditions, mergeMatchingAutofillRules } from "@eesimple/types";
import { db } from "@/db";
import { autofillRules, type BookmarkRow } from "@/db/schema";
import { getBookmarkEvaluationData } from "@/services/bookmarkCache";
import { hydrateBookmarkRows } from "@/services/bookmarkHydration";
import { byPriorityThenNewest, hydrate } from "@/services/autofillRules";
import { listCategories } from "@/services/categories";

/** Default number of bookmarks an autofill preview returns when the caller doesn't specify one. */
const DEFAULT_PREVIEW_LIMIT = 5;

/**
 * Evaluate all autofill rules against the given URL and title (the only fields known before a
 * bookmark is created) and return the union of all matching rules' suggested values. Mirrors the
 * client-side `applyAutofill` so that server-side bookmark creation (e.g. Inbox approval) applies
 * the same rules the form would have.
 */
export async function suggestAutofillForBookmark(input: {
  url: string;
  title: string;
}): Promise<{
  categoryId: string | null;
  mediaTypeId: string | null;
  tagIds: string[];
  locationIds: string[];
  numberValues: BookmarkNumberValue[];
  booleanValues: BookmarkBooleanValue[];
  dateTimeValues: BookmarkDateTimeValue[];
}> {
  const rows = await db
    .select()
    .from(autofillRules)
    .orderBy(asc(autofillRules.sortOrder), asc(autofillRules.createdAt));
  if (rows.length === 0) {
    return {
      categoryId: null,
      mediaTypeId: null,
      tagIds: [],
      locationIds: [],
      numberValues: [],
      booleanValues: [],
      dateTimeValues: [],
    };
  }
  const rules = await hydrate(rows);
  return mergeMatchingAutofillRules(input, rules);
}

/**
 * Preview which existing bookmarks a condition tree would match, evaluated server-side with the
 * same shared `evaluateConditions` predicate the autofill/homepage engines use (over the cached
 * per-bookmark inputs — see `bookmarkCache`). This replaces the client loading the entire bookmark
 * set just to test conditions.
 *
 * With a `query`, the result lists the bookmarks whose title/url/category name contains it — each
 * annotated with whether it matches `conditions` — so the caller can show match/no-match for a named
 * bookmark. Without a `query`, only the bookmarks that satisfy `conditions` are returned (all
 * `matches: true`).
 */
export async function previewAutofillMatches(
  input: AutofillPreviewInput,
): Promise<AutofillPreviewResult> {
  const limit = input.limit && input.limit > 0 ? input.limit : DEFAULT_PREVIEW_LIMIT;
  const {
    baseRows, conditionInputs, evaluateOptions,
  } = await getBookmarkEvaluationData();

  const matches = (row: BookmarkRow): boolean => {
    const conditionInput = conditionInputs.get(row.id);
    if (!conditionInput) return false;
    return evaluateConditions(input.conditions, conditionInput, evaluateOptions);
  };

  const query = input.query?.trim().toLowerCase();
  // Category names so the text search can also match by a bookmark's category (not just title/url).
  const categoryNameById = query
    ? new Map((await listCategories()).map(category => [category.id, category.name.toLowerCase()]))
    : null;
  const candidates = (query
    ? baseRows.filter(row =>
      row.title.toLowerCase().includes(query)
      || (row.url?.toLowerCase() ?? "").includes(query)
      || (row.categoryId != null && (categoryNameById?.get(row.categoryId)?.includes(query) ?? false)))
    : baseRows.filter(matches))
    .sort(byPriorityThenNewest)
    .slice(0, limit);

  const hydrated = await hydrateBookmarkRows(candidates);
  const hydratedById = new Map(hydrated.map(bookmark => [bookmark.id, bookmark]));

  const entries: AutofillPreviewEntry[] = [];
  for (const row of candidates) {
    const bookmark = hydratedById.get(row.id);
    if (!bookmark) continue;
    entries.push({
      bookmark,
      // In query mode `candidates` aren't pre-filtered by match, so evaluate each; in search mode
      // they already matched.
      matches: query ? matches(row) : true,
    });
  }
  return {
    entries,
  };
}
