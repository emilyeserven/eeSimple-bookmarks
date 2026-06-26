import { and, asc, eq, inArray, isNull, ne } from "drizzle-orm";
import type {
  AutofillApplyInput,
  AutofillApplyResult,
  AutofillBackfillEntry,
  AutofillBackfillResult,
  AutofillPreviewEntry,
  AutofillPreviewInput,
  AutofillPreviewResult,
  AutofillRule,
  Bookmark,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  BulkDeleteResult,
  ConditionInput,
  ConditionMatchField,
  ConditionMatchOperator,
  ConditionNode,
  ConditionTree,
  CreateAutofillRuleInput,
  GlobalAutofillBackfillGroup,
  GlobalAutofillBackfillResult,
  UpdateAutofillRuleInput,
} from "@eesimple/types";
import { emptyConditionTree, evaluateConditions, normalizeDomain } from "@eesimple/types";
import { db } from "@/db";
import {
  autofillRuleBooleanValues,
  autofillRuleDateTimeValues,
  autofillRuleExemptions,
  autofillRuleNumberValues,
  autofillRules,
  type AutofillRuleRow,
  autofillRuleTags,
  bookmarkBooleanValues,
  bookmarkDateTimeValues,
  bookmarkNumberValues,
  bookmarks,
  bookmarkTags,
  type BookmarkRow,
  tags,
} from "@/db/schema";
import { getBookmarkEvaluationData, invalidateBookmarkCache } from "@/services/bookmarkCache";
import { hydrateBookmarkRows } from "@/services/bookmarkHydration";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { recomputeCalculatedValues } from "@/services/bookmarkWrites";
import { listCategories } from "@/services/categories";
import { slugify } from "@/utils/slug";

/** Default number of bookmarks an autofill preview returns when the caller doesn't specify one. */
const DEFAULT_PREVIEW_LIMIT = 5;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Pick an autofill rule slug unique within existing rule slugs. Falls back to "rule" for empty names. */
function uniqueAutofillSlug(name: string, taken: Set<string>): string {
  const base = slugify(name) || "rule";
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/** Fetch the set of all existing autofill rule slugs, optionally excluding one rule. */
async function takenAutofillSlugs(excludeId?: string): Promise<Set<string>> {
  const rows = await db
    .select({
      slug: autofillRules.slug,
    })
    .from(autofillRules)
    .where(excludeId ? ne(autofillRules.id, excludeId) : undefined);
  return new Set(rows.map(r => r.slug).filter((s): s is string => s !== null));
}

/** Map a DB row plus its hydrated relations to the shared `AutofillRule` wire type. */
function toAutofillRule(
  row: AutofillRuleRow,
  tagIds: string[],
  numberValues: BookmarkNumberValue[],
  booleanValues: BookmarkBooleanValue[],
  dateTimeValues: BookmarkDateTimeValue[],
): AutofillRule {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    description: row.description,
    conditions: row.conditions ?? emptyConditionTree(),
    setCategoryId: row.setCategoryId,
    setMediaTypeId: row.setMediaTypeId,
    tagIds,
    numberValues,
    booleanValues,
    dateTimeValues,
    sortOrder: row.sortOrder,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

/** Load tag ids for a set of rule ids in a single query, grouped by rule id. */
async function tagIdsByRuleId(ruleIds: string[]): Promise<Map<string, string[]>> {
  const grouped = new Map<string, string[]>();
  if (ruleIds.length === 0) return grouped;

  const rows = await db
    .select({
      ruleId: autofillRuleTags.ruleId,
      tagId: autofillRuleTags.tagId,
    })
    .from(autofillRuleTags)
    .where(inArray(autofillRuleTags.ruleId, ruleIds));

  for (const row of rows) {
    const list = grouped.get(row.ruleId) ?? [];
    list.push(row.tagId);
    grouped.set(row.ruleId, list);
  }
  return grouped;
}

/** Load number property values for a set of rule ids, grouped by rule id. */
async function numberValuesByRuleId(
  ruleIds: string[],
): Promise<Map<string, BookmarkNumberValue[]>> {
  const grouped = new Map<string, BookmarkNumberValue[]>();
  if (ruleIds.length === 0) return grouped;

  const rows = await db
    .select({
      ruleId: autofillRuleNumberValues.ruleId,
      propertyId: autofillRuleNumberValues.propertyId,
      value: autofillRuleNumberValues.value,
    })
    .from(autofillRuleNumberValues)
    .where(inArray(autofillRuleNumberValues.ruleId, ruleIds));

  for (const row of rows) {
    const list = grouped.get(row.ruleId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
    });
    grouped.set(row.ruleId, list);
  }
  return grouped;
}

/** Load boolean property values for a set of rule ids, grouped by rule id. */
async function booleanValuesByRuleId(
  ruleIds: string[],
): Promise<Map<string, BookmarkBooleanValue[]>> {
  const grouped = new Map<string, BookmarkBooleanValue[]>();
  if (ruleIds.length === 0) return grouped;

  const rows = await db
    .select({
      ruleId: autofillRuleBooleanValues.ruleId,
      propertyId: autofillRuleBooleanValues.propertyId,
      value: autofillRuleBooleanValues.value,
    })
    .from(autofillRuleBooleanValues)
    .where(inArray(autofillRuleBooleanValues.ruleId, ruleIds));

  for (const row of rows) {
    const list = grouped.get(row.ruleId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
    });
    grouped.set(row.ruleId, list);
  }
  return grouped;
}

/** Load date/time property values for a set of rule ids, grouped by rule id. */
async function dateTimeValuesByRuleId(
  ruleIds: string[],
): Promise<Map<string, BookmarkDateTimeValue[]>> {
  const grouped = new Map<string, BookmarkDateTimeValue[]>();
  if (ruleIds.length === 0) return grouped;

  const rows = await db
    .select({
      ruleId: autofillRuleDateTimeValues.ruleId,
      propertyId: autofillRuleDateTimeValues.propertyId,
      value: autofillRuleDateTimeValues.value,
    })
    .from(autofillRuleDateTimeValues)
    .where(inArray(autofillRuleDateTimeValues.ruleId, ruleIds));

  for (const row of rows) {
    const list = grouped.get(row.ruleId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
    });
    grouped.set(row.ruleId, list);
  }
  return grouped;
}

/** Hydrate a set of rule rows with their tags and property values. */
async function hydrate(rows: AutofillRuleRow[]): Promise<AutofillRule[]> {
  const ids = rows.map(row => row.id);
  const [tagMap, numberMap, booleanMap, dateTimeMap] = await Promise.all([
    tagIdsByRuleId(ids),
    numberValuesByRuleId(ids),
    booleanValuesByRuleId(ids),
    dateTimeValuesByRuleId(ids),
  ]);
  return rows.map(row =>
    toAutofillRule(
      row,
      tagMap.get(row.id) ?? [],
      numberMap.get(row.id) ?? [],
      booleanMap.get(row.id) ?? [],
      dateTimeMap.get(row.id) ?? [],
    ));
}

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
      numberValues: [],
      booleanValues: [],
      dateTimeValues: [],
    };
  }
  const rules = await hydrate(rows);

  let categoryId: string | null = null;
  let mediaTypeId: string | null = null;
  const tagIds = new Set<string>();
  const numberByProperty = new Map<string, number>();
  const booleanByProperty = new Map<string, boolean>();
  const dateTimeByProperty = new Map<string, string>();

  const projection: ConditionInput = {
    url: input.url,
    title: input.title,
    categoryId: "",
    tagIds: new Set(),
    youtubeChannelId: null,
    mediaTypeId: null,
    numberValues: new Map(),
    booleanValues: new Map(),
    dateTimeValues: new Map(),
    fileValues: new Set(),
    relationshipTypeIds: new Set(),
    choicesValues: new Map(),
    sectionsValues: new Map(),
    textValues: new Map(),
  };

  for (const rule of rules) {
    if (!evaluateConditions(rule.conditions, projection)) continue;
    if (rule.setCategoryId) categoryId = rule.setCategoryId;
    if (rule.setMediaTypeId) mediaTypeId = rule.setMediaTypeId;
    for (const tagId of rule.tagIds) tagIds.add(tagId);
    for (const entry of rule.numberValues) numberByProperty.set(entry.propertyId, entry.value);
    for (const entry of rule.booleanValues) booleanByProperty.set(entry.propertyId, entry.value);
    for (const entry of rule.dateTimeValues) dateTimeByProperty.set(entry.propertyId, entry.value);
  }

  return {
    categoryId,
    mediaTypeId,
    tagIds: [...tagIds],
    numberValues: [...numberByProperty].map(([propertyId, value]) => ({
      propertyId,
      value,
    })),
    booleanValues: [...booleanByProperty].map(([propertyId, value]) => ({
      propertyId,
      value,
    })),
    dateTimeValues: [...dateTimeByProperty].map(([propertyId, value]) => ({
      propertyId,
      value,
    })),
  };
}

export async function listAutofillRules(): Promise<AutofillRule[]> {
  const rows = await db
    .select()
    .from(autofillRules)
    .orderBy(asc(autofillRules.sortOrder), asc(autofillRules.createdAt));
  const [rules, evaluation] = await Promise.all([
    hydrate(rows),
    getBookmarkEvaluationData(),
  ]);

  // Count how many existing bookmarks each rule currently matches, evaluated with the same shared
  // predicate the autofill/homepage engines use over the cached per-bookmark inputs (no extra I/O).
  const {
    baseRows, conditionInputs, tagDescendants,
  } = evaluation;
  return rules.map((rule) => {
    let matchCount = 0;
    for (const row of baseRows) {
      const conditionInput = conditionInputs.get(row.id);
      if (conditionInput && evaluateConditions(rule.conditions, conditionInput, {
        tagDescendants,
      })) {
        matchCount += 1;
      }
    }
    return {
      ...rule,
      matchCount,
    };
  });
}

export async function getAutofillRule(id: string): Promise<AutofillRule | null> {
  const [row] = await db.select().from(autofillRules).where(eq(autofillRules.id, id));
  if (!row) return null;
  const [hydrated] = await hydrate([row]);
  return hydrated ?? null;
}

/** Replace a rule's tag links with the given set (delete then insert). */
async function setRuleTags(tx: Tx, ruleId: string, tagIds: string[]): Promise<void> {
  await tx.delete(autofillRuleTags).where(eq(autofillRuleTags.ruleId, ruleId));
  if (tagIds.length === 0) return;
  await tx.insert(autofillRuleTags).values([...new Set(tagIds)].map(tagId => ({
    ruleId,
    tagId,
  })));
}

/** Replace a rule's number property values (delete then insert). */
async function setRuleNumberValues(
  tx: Tx,
  ruleId: string,
  numberValues: BookmarkNumberValue[],
): Promise<void> {
  await tx.delete(autofillRuleNumberValues).where(eq(autofillRuleNumberValues.ruleId, ruleId));
  if (numberValues.length === 0) return;
  await tx.insert(autofillRuleNumberValues).values(numberValues.map(entry => ({
    ruleId,
    propertyId: entry.propertyId,
    value: entry.value,
  })));
}

/** Replace a rule's boolean property values (delete then insert). */
async function setRuleBooleanValues(
  tx: Tx,
  ruleId: string,
  booleanValues: BookmarkBooleanValue[],
): Promise<void> {
  await tx.delete(autofillRuleBooleanValues).where(eq(autofillRuleBooleanValues.ruleId, ruleId));
  if (booleanValues.length === 0) return;
  await tx.insert(autofillRuleBooleanValues).values(booleanValues.map(entry => ({
    ruleId,
    propertyId: entry.propertyId,
    value: entry.value,
  })));
}

/** Replace a rule's date/time property values (delete then insert). */
async function setRuleDateTimeValues(
  tx: Tx,
  ruleId: string,
  dateTimeValues: BookmarkDateTimeValue[],
): Promise<void> {
  await tx.delete(autofillRuleDateTimeValues).where(eq(autofillRuleDateTimeValues.ruleId, ruleId));
  if (dateTimeValues.length === 0) return;
  await tx.insert(autofillRuleDateTimeValues).values(dateTimeValues.map(entry => ({
    ruleId,
    propertyId: entry.propertyId,
    value: entry.value,
  })));
}

export async function createAutofillRule(input: CreateAutofillRuleInput): Promise<AutofillRule> {
  const taken = await takenAutofillSlugs();
  const slug = uniqueAutofillSlug(input.name, taken);

  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(autofillRules)
      .values({
        name: input.name,
        slug,
        description: input.description ?? null,
        conditions: input.conditions,
        setCategoryId: input.setCategoryId ?? null,
        setMediaTypeId: input.setMediaTypeId ?? null,
        sortOrder: input.sortOrder ?? 0,
      })
      .returning({
        id: autofillRules.id,
      });
    await setRuleTags(tx, row.id, input.tagIds ?? []);
    await setRuleNumberValues(tx, row.id, input.numberValues ?? []);
    await setRuleBooleanValues(tx, row.id, input.booleanValues ?? []);
    await setRuleDateTimeValues(tx, row.id, input.dateTimeValues ?? []);
    return row.id;
  });
  // Re-read so callers always get the hydrated shape.
  return (await getAutofillRule(id))!;
}

export async function updateAutofillRule(
  id: string,
  input: UpdateAutofillRuleInput,
): Promise<AutofillRule | null> {
  const found = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: autofillRules.id,
        name: autofillRules.name,
      })
      .from(autofillRules)
      .where(eq(autofillRules.id, id));
    if (!existing) return false;

    const patch: Partial<
      Pick<AutofillRuleRow, "name" | "slug" | "description" | "conditions" | "setCategoryId" | "setMediaTypeId" | "sortOrder">
    > = {};
    if (input.name !== undefined) {
      patch.name = input.name;
      if (input.name !== existing.name) {
        const taken = await takenAutofillSlugs(id);
        patch.slug = uniqueAutofillSlug(input.name, taken);
      }
    }
    if (input.description !== undefined) patch.description = input.description ?? null;
    if (input.conditions !== undefined) patch.conditions = input.conditions;
    if (input.setCategoryId !== undefined) patch.setCategoryId = input.setCategoryId ?? null;
    if (input.setMediaTypeId !== undefined) patch.setMediaTypeId = input.setMediaTypeId ?? null;
    if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;

    if (Object.keys(patch).length > 0) {
      await tx.update(autofillRules).set(patch).where(eq(autofillRules.id, id));
    }

    if (input.tagIds !== undefined) await setRuleTags(tx, id, input.tagIds);
    if (input.numberValues !== undefined) await setRuleNumberValues(tx, id, input.numberValues);
    if (input.booleanValues !== undefined) await setRuleBooleanValues(tx, id, input.booleanValues);
    if (input.dateTimeValues !== undefined) await setRuleDateTimeValues(tx, id, input.dateTimeValues);
    return true;
  });

  return found ? getAutofillRule(id) : null;
}

export async function deleteAutofillRule(id: string): Promise<boolean> {
  // FK cascade removes the rule's tags and property values.
  const rows = await db.delete(autofillRules).where(eq(autofillRules.id, id)).returning({
    id: autofillRules.id,
  });
  return rows.length > 0;
}

/** Delete many autofill rules, reporting per-item outcomes. */
export function bulkDeleteAutofillRules(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteAutofillRule);
}

export async function getAutofillRuleBySlug(slug: string): Promise<AutofillRule | null> {
  const [row] = await db.select().from(autofillRules).where(eq(autofillRules.slug, slug));
  if (!row) return null;
  const [hydrated] = await hydrate([row]);
  return hydrated ?? null;
}

/** Sort matchable bookmark rows the way the homepage matcher does: priority desc, then newest. */
function byPriorityThenNewest(a: BookmarkRow, b: BookmarkRow): number {
  return b.priority - a.priority
    || (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0);
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
    baseRows, conditionInputs, tagDescendants,
  } = await getBookmarkEvaluationData();

  const matches = (row: BookmarkRow): boolean => {
    const conditionInput = conditionInputs.get(row.id);
    if (!conditionInput) return false;
    return evaluateConditions(input.conditions, conditionInput, {
      tagDescendants,
    });
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

/** Ids of every tag currently flagged `exclude_from_backfill = true`. */
async function getExcludedFromBackfillTagIds(): Promise<Set<string>> {
  const rows = await db
    .select({
      id: tags.id,
    })
    .from(tags)
    .where(eq(tags.excludeFromBackfill, true));
  return new Set(rows.map(r => r.id));
}

/** True when applying the rule would change at least one field on the bookmark. */
function computeNeedsBackfill(
  rule: AutofillRule,
  bookmark: Bookmark,
  globallyExcludedTagIds: Set<string>,
): boolean {
  const hasPrefill
    = rule.setCategoryId != null
      || rule.setMediaTypeId != null
      || rule.tagIds.length > 0
      || rule.numberValues.length > 0
      || rule.booleanValues.length > 0
      || rule.dateTimeValues.length > 0;
  if (!hasPrefill) return false;

  if (rule.setCategoryId && bookmark.categoryId !== rule.setCategoryId) return true;
  if (rule.setMediaTypeId && bookmark.mediaType?.id !== rule.setMediaTypeId) return true;

  const existingTagIds = new Set(bookmark.tags.map(t => t.id));
  const effectiveTagIds = rule.tagIds.filter(
    id => !bookmark.blacklistedTagIds.includes(id) && !globallyExcludedTagIds.has(id),
  );
  if (effectiveTagIds.some(id => !existingTagIds.has(id))) return true;

  const numById = new Map(bookmark.numberValues.map(v => [v.propertyId, v.value]));
  if (rule.numberValues.some(v => numById.get(v.propertyId) !== v.value)) return true;

  const boolById = new Map(bookmark.booleanValues.map(v => [v.propertyId, v.value]));
  if (rule.booleanValues.some(v => boolById.get(v.propertyId) !== v.value)) return true;

  const dtById = new Map(bookmark.dateTimeValues.map(v => [v.propertyId, v.value]));
  if (rule.dateTimeValues.some(v => dtById.get(v.propertyId) !== v.value)) return true;

  return false;
}

/**
 * Return all bookmarks currently matching the rule's conditions, each annotated with whether the
 * rule's prefill values are already applied. No pagination — the bookmark cache is in memory.
 */
export async function getAutofillBackfillEntries(ruleId: string): Promise<AutofillBackfillResult | null> {
  const rule = await getAutofillRule(ruleId);
  if (!rule) return null;

  const {
    baseRows, conditionInputs, tagDescendants,
  } = await getBookmarkEvaluationData();

  const matchingRows = baseRows.filter((row) => {
    const ci = conditionInputs.get(row.id);
    return ci
      ? evaluateConditions(rule.conditions, ci, {
        tagDescendants,
      })
      : false;
  });
  matchingRows.sort(byPriorityThenNewest);

  const [exemptRows, globallyExcludedTagIds] = await Promise.all([
    db.select().from(autofillRuleExemptions).where(eq(autofillRuleExemptions.ruleId, ruleId)),
    getExcludedFromBackfillTagIds(),
  ]);
  const exemptSet = new Set(exemptRows.map(r => r.bookmarkId));

  const hydrated = await hydrateBookmarkRows(matchingRows);
  const hydratedById = new Map(hydrated.map(b => [b.id, b]));

  const entries: AutofillBackfillEntry[] = [];
  for (const row of matchingRows) {
    const bookmark = hydratedById.get(row.id);
    if (!bookmark) continue;
    const isExempt = exemptSet.has(row.id);
    entries.push({
      bookmark,
      needsBackfill: !isExempt && computeNeedsBackfill(rule, bookmark, globallyExcludedTagIds),
      isExempt,
    });
  }
  return {
    entries,
  };
}

/**
 * Apply the rule's prefill values to the given bookmarks. Re-validates conditions at apply time;
 * bookmarks that no longer match are counted as skipped.
 *
 * Apply semantics: tags are additive (INSERT ON CONFLICT DO NOTHING); category, media type, and
 * property values override whatever the bookmark currently has.
 */
export async function applyAutofillBackfill(
  ruleId: string,
  input: AutofillApplyInput,
): Promise<AutofillApplyResult | null> {
  if (input.bookmarkIds.length === 0) return {
    applied: 0,
    skipped: 0,
  };

  const rule = await getAutofillRule(ruleId);
  if (!rule) return null;

  const [{
    baseRows, conditionInputs, tagDescendants,
  }, exemptRows, globallyExcludedTagIds] = await Promise.all([
    getBookmarkEvaluationData(),
    db.select().from(autofillRuleExemptions).where(eq(autofillRuleExemptions.ruleId, ruleId)),
    getExcludedFromBackfillTagIds(),
  ]);
  const exemptSet = new Set(exemptRows.map(r => r.bookmarkId));

  const requestedSet = new Set(input.bookmarkIds);
  const baseRowById = new Map(baseRows.map(r => [r.id, r]));

  const toApply: string[] = [];
  let skipped = 0;
  for (const id of input.bookmarkIds) {
    if (exemptSet.has(id)) {
      skipped += 1;
      continue;
    }
    const row = baseRowById.get(id);
    if (!row) {
      skipped += 1;
      continue;
    }
    const ci = conditionInputs.get(id);
    if (!ci || !evaluateConditions(rule.conditions, ci, {
      tagDescendants,
    })) {
      skipped += 1;
    }
    else {
      toApply.push(id);
    }
  }

  if (toApply.length === 0) return {
    applied: 0,
    skipped,
  };

  const matchingRows = baseRows.filter(r => requestedSet.has(r.id) && toApply.includes(r.id));
  const hydrated = await hydrateBookmarkRows(matchingRows);
  let applied = 0;

  for (const bookmark of hydrated) {
    if (!computeNeedsBackfill(rule, bookmark, globallyExcludedTagIds)) {
      skipped += 1;
      continue;
    }

    await db.transaction(async (tx) => {
      const patch: Partial<{ categoryId: string;
        mediaTypeId: string | null; }> = {};
      if (rule.setCategoryId) patch.categoryId = rule.setCategoryId;
      if (rule.setMediaTypeId !== undefined) patch.mediaTypeId = rule.setMediaTypeId;
      if (Object.keys(patch).length > 0) {
        await tx.update(bookmarks).set(patch).where(eq(bookmarks.id, bookmark.id));
      }

      const tagsToInsert = rule.tagIds.filter(
        id => !bookmark.blacklistedTagIds.includes(id) && !globallyExcludedTagIds.has(id),
      );
      if (tagsToInsert.length > 0) {
        await tx
          .insert(bookmarkTags)
          .values(tagsToInsert.map(tagId => ({
            bookmarkId: bookmark.id,
            tagId,
          })))
          .onConflictDoNothing();
      }

      for (const entry of rule.numberValues) {
        await tx
          .insert(bookmarkNumberValues)
          .values({
            bookmarkId: bookmark.id,
            propertyId: entry.propertyId,
            value: entry.value,
          })
          .onConflictDoUpdate({
            target: [bookmarkNumberValues.bookmarkId, bookmarkNumberValues.propertyId],
            set: {
              value: entry.value,
            },
          });
      }

      for (const entry of rule.booleanValues) {
        await tx
          .insert(bookmarkBooleanValues)
          .values({
            bookmarkId: bookmark.id,
            propertyId: entry.propertyId,
            value: entry.value,
          })
          .onConflictDoUpdate({
            target: [bookmarkBooleanValues.bookmarkId, bookmarkBooleanValues.propertyId],
            set: {
              value: entry.value,
            },
          });
      }

      for (const entry of rule.dateTimeValues) {
        await tx
          .insert(bookmarkDateTimeValues)
          .values({
            bookmarkId: bookmark.id,
            propertyId: entry.propertyId,
            value: entry.value,
          })
          .onConflictDoUpdate({
            target: [bookmarkDateTimeValues.bookmarkId, bookmarkDateTimeValues.propertyId],
            set: {
              value: entry.value,
            },
          });
      }

      if (rule.numberValues.length > 0) {
        await recomputeCalculatedValues(tx, bookmark.id);
      }
    });

    applied += 1;
  }

  if (applied > 0) invalidateBookmarkCache();

  return {
    applied,
    skipped,
  };
}

/**
 * Cross-rule backfill overview: for every rule, return the bookmarks that either need backfill or
 * have been explicitly exempted. Rules with no qualifying entries are omitted.
 */
export async function getGlobalBackfill(): Promise<GlobalAutofillBackfillResult> {
  const [rules, {
    baseRows, conditionInputs, tagDescendants,
  }, allExemptions, globallyExcludedTagIds] = await Promise.all([
    listAutofillRules(),
    getBookmarkEvaluationData(),
    db.select().from(autofillRuleExemptions),
    getExcludedFromBackfillTagIds(),
  ]);

  const exemptsByRule = new Map<string, Set<string>>();
  for (const e of allExemptions) {
    if (!exemptsByRule.has(e.ruleId)) exemptsByRule.set(e.ruleId, new Set());
    exemptsByRule.get(e.ruleId)!.add(e.bookmarkId);
  }

  const groups: GlobalAutofillBackfillGroup[] = [];
  let totalNeedsBackfill = 0;

  for (const rule of rules) {
    const exemptSet = exemptsByRule.get(rule.id) ?? new Set<string>();
    const matchingRows = baseRows.filter((row) => {
      const ci = conditionInputs.get(row.id);
      return ci
        ? evaluateConditions(rule.conditions, ci, {
          tagDescendants,
        })
        : false;
    });
    matchingRows.sort(byPriorityThenNewest);

    const hydrated = await hydrateBookmarkRows(matchingRows);
    const hydratedById = new Map(hydrated.map(b => [b.id, b]));

    const entries: AutofillBackfillEntry[] = [];
    for (const row of matchingRows) {
      const bookmark = hydratedById.get(row.id);
      if (!bookmark) continue;
      const isExempt = exemptSet.has(row.id);
      const needsBackfill = !isExempt && computeNeedsBackfill(rule, bookmark, globallyExcludedTagIds);
      if (needsBackfill || isExempt) {
        entries.push({
          bookmark,
          needsBackfill,
          isExempt,
        });
      }
    }

    if (entries.length > 0) {
      const needsBackfillCount = entries.filter(e => e.needsBackfill).length;
      const exemptCount = entries.filter(e => e.isExempt).length;
      totalNeedsBackfill += needsBackfillCount;
      groups.push({
        rule: {
          id: rule.id,
          name: rule.name,
          slug: rule.slug,
        },
        entries,
        needsBackfillCount,
        exemptCount,
      });
    }
  }

  return {
    groups,
    totalNeedsBackfill,
  };
}

/** Mark a bookmark as exempt from backfill for a specific rule. Idempotent. */
export async function setAutofillExempt(ruleId: string, bookmarkId: string): Promise<void> {
  await db
    .insert(autofillRuleExemptions)
    .values({
      ruleId,
      bookmarkId,
    })
    .onConflictDoNothing();
}

/** Remove a bookmark's exemption from a specific rule's backfill. */
export async function removeAutofillExempt(ruleId: string, bookmarkId: string): Promise<void> {
  await db
    .delete(autofillRuleExemptions)
    .where(
      and(
        eq(autofillRuleExemptions.ruleId, ruleId),
        eq(autofillRuleExemptions.bookmarkId, bookmarkId),
      ),
    );
}

/**
 * Backfill `slug` for autofill rules that predate the column. Runs at boot; idempotent.
 */
export async function ensureAutofillSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: autofillRules.id,
      name: autofillRules.name,
    })
    .from(autofillRules)
    .where(isNull(autofillRules.slug));
  if (missing.length === 0) return;

  const taken = await takenAutofillSlugs();
  for (const rule of missing) {
    const slug = uniqueAutofillSlug(rule.name, taken);
    taken.add(slug);
    await db.update(autofillRules).set({
      slug,
    }).where(eq(autofillRules.id, rule.id));
  }
}

/**
 * Backfill `conditions` for rules created before the condition tree existed, wrapping each rule's
 * legacy `field`/`operator`/`pattern` in a single-leaf AND group. Runs at boot; idempotent.
 */
export async function ensureAutofillConditions(): Promise<void> {
  const rows = await db
    .select({
      id: autofillRules.id,
      field: autofillRules.field,
      operator: autofillRules.operator,
      pattern: autofillRules.pattern,
    })
    .from(autofillRules)
    .where(isNull(autofillRules.conditions));

  for (const row of rows) {
    const conditions: ConditionTree = {
      type: "group",
      combinator: "and",
      children: [{
        type: "match",
        field: (row.field as ConditionMatchField | null) ?? "url",
        operator: (row.operator as ConditionMatchOperator | null) ?? "contains",
        pattern: row.pattern ?? "",
      }],
    };
    await db.update(autofillRules).set({
      conditions,
    }).where(eq(autofillRules.id, row.id));
  }
}

/**
 * Rewrite a condition node, turning any legacy `match` leaf with the `domain` operator into a
 * dedicated `website` leaf. Returns the original node when nothing changed so callers can detect
 * a no-op. Recurses into groups so deeply nested legacy trees are migrated too.
 */
export function migrateDomainMatches(node: ConditionNode): { node: ConditionNode;
  changed: boolean; } {
  if (node.type === "match" && node.operator === "domain") {
    return {
      node: {
        type: "website",
        domains: [normalizeDomain(node.pattern)],
      },
      changed: true,
    };
  }
  if (node.type === "group") {
    let changed = false;
    const children = node.children.map((child) => {
      const result = migrateDomainMatches(child);
      if (result.changed) changed = true;
      return result.node;
    });
    return changed
      ? {
        node: {
          ...node,
          children,
        },
        changed: true,
      }
      : {
        node,
        changed: false,
      };
  }
  return {
    node,
    changed: false,
  };
}

/**
 * Backfill the dedicated `website` leaf for rules that still encode a website match via the legacy
 * `match`/`domain` operator. Runs at boot; idempotent (rules without a domain match are untouched).
 */
export async function ensureWebsiteConditions(): Promise<void> {
  const rows = await db
    .select({
      id: autofillRules.id,
      conditions: autofillRules.conditions,
    })
    .from(autofillRules);

  for (const row of rows) {
    const tree = row.conditions as ConditionTree | null;
    if (!tree) continue;
    const result = migrateDomainMatches(tree);
    if (!result.changed) continue;
    await db.update(autofillRules).set({
      conditions: result.node as ConditionTree,
    }).where(eq(autofillRules.id, row.id));
  }
}
