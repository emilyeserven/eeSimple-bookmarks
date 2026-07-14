import { asc, eq, inArray, ne } from "drizzle-orm";
import type {
  AutofillRule,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  BulkDeleteResult,
  CreateAutofillRuleInput,
  UpdateAutofillRuleInput,
} from "@eesimple/types";
import { emptyConditionTree, evaluateConditions } from "@eesimple/types";
import { db } from "@/db";
import {
  autofillRuleBooleanValues,
  autofillRuleDateTimeValues,
  autofillRuleLocations,
  autofillRuleNumberValues,
  autofillRules,
  type AutofillRuleRow,
  autofillRuleTags,
  type BookmarkRow,
} from "@/db/schema";
import { getBookmarkEvaluationData } from "@/services/bookmarkCache";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { slugify } from "@/utils/slug";

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
  locationIds: string[],
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
    locationIds,
    numberValues,
    booleanValues,
    dateTimeValues,
    sortOrder: row.sortOrder,
    isFavorite: row.isFavorite,
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

/** Load location ids for a set of rule ids in a single query, grouped by rule id. */
async function locationIdsByRuleId(ruleIds: string[]): Promise<Map<string, string[]>> {
  const grouped = new Map<string, string[]>();
  if (ruleIds.length === 0) return grouped;

  const rows = await db
    .select({
      ruleId: autofillRuleLocations.ruleId,
      locationId: autofillRuleLocations.locationId,
    })
    .from(autofillRuleLocations)
    .where(inArray(autofillRuleLocations.ruleId, ruleIds));

  for (const row of rows) {
    const list = grouped.get(row.ruleId) ?? [];
    list.push(row.locationId);
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
      valueEnd: autofillRuleNumberValues.valueEnd,
    })
    .from(autofillRuleNumberValues)
    .where(inArray(autofillRuleNumberValues.ruleId, ruleIds));

  for (const row of rows) {
    const list = grouped.get(row.ruleId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
      valueEnd: row.valueEnd ?? null,
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
export async function hydrate(rows: AutofillRuleRow[]): Promise<AutofillRule[]> {
  const ids = rows.map(row => row.id);
  const [tagMap, locationMap, numberMap, booleanMap, dateTimeMap] = await Promise.all([
    tagIdsByRuleId(ids),
    locationIdsByRuleId(ids),
    numberValuesByRuleId(ids),
    booleanValuesByRuleId(ids),
    dateTimeValuesByRuleId(ids),
  ]);
  return rows.map(row =>
    toAutofillRule(
      row,
      tagMap.get(row.id) ?? [],
      locationMap.get(row.id) ?? [],
      numberMap.get(row.id) ?? [],
      booleanMap.get(row.id) ?? [],
      dateTimeMap.get(row.id) ?? [],
    ));
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
    baseRows, conditionInputs, evaluateOptions,
  } = evaluation;
  return rules.map((rule) => {
    let matchCount = 0;
    for (const row of baseRows) {
      const conditionInput = conditionInputs.get(row.id);
      if (conditionInput && evaluateConditions(rule.conditions, conditionInput, evaluateOptions)) {
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

/** Replace a rule's location links (delete then insert). */
async function setRuleLocations(tx: Tx, ruleId: string, locationIds: string[]): Promise<void> {
  await tx.delete(autofillRuleLocations).where(eq(autofillRuleLocations.ruleId, ruleId));
  if (locationIds.length === 0) return;
  await tx.insert(autofillRuleLocations).values([...new Set(locationIds)].map(locationId => ({
    ruleId,
    locationId,
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
    valueEnd: entry.valueEnd ?? null,
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
    await setRuleLocations(tx, row.id, input.locationIds ?? []);
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
      Pick<AutofillRuleRow, "name" | "slug" | "description" | "conditions" | "setCategoryId" | "setMediaTypeId" | "sortOrder" | "isFavorite">
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
    if (input.isFavorite !== undefined) patch.isFavorite = input.isFavorite;

    if (Object.keys(patch).length > 0) {
      await tx.update(autofillRules).set(patch).where(eq(autofillRules.id, id));
    }

    if (input.tagIds !== undefined) await setRuleTags(tx, id, input.tagIds);
    if (input.locationIds !== undefined) await setRuleLocations(tx, id, input.locationIds);
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
export function byPriorityThenNewest(a: BookmarkRow, b: BookmarkRow): number {
  return b.priority - a.priority
    || (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0);
}
