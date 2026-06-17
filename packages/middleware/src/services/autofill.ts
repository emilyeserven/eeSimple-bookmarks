import { asc, eq, inArray, isNull } from "drizzle-orm";
import type {
  AutofillRule,
  BookmarkBooleanValue,
  BookmarkNumberValue,
  ConditionMatchField,
  ConditionMatchOperator,
  ConditionTree,
  CreateAutofillRuleInput,
  UpdateAutofillRuleInput,
} from "@eesimple/types";
import { emptyConditionTree } from "@eesimple/types";
import { db } from "@/db";
import {
  autofillRuleBooleanValues,
  autofillRuleNumberValues,
  autofillRules,
  type AutofillRuleRow,
  autofillRuleTags,
} from "@/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Map a DB row plus its hydrated relations to the shared `AutofillRule` wire type. */
function toAutofillRule(
  row: AutofillRuleRow,
  tagIds: string[],
  numberValues: BookmarkNumberValue[],
  booleanValues: BookmarkBooleanValue[],
): AutofillRule {
  return {
    id: row.id,
    name: row.name,
    conditions: row.conditions ?? emptyConditionTree(),
    setCategoryId: row.setCategoryId,
    tagIds,
    numberValues,
    booleanValues,
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

/** Hydrate a set of rule rows with their tags and property values. */
async function hydrate(rows: AutofillRuleRow[]): Promise<AutofillRule[]> {
  const ids = rows.map(row => row.id);
  const [tagMap, numberMap, booleanMap] = await Promise.all([
    tagIdsByRuleId(ids),
    numberValuesByRuleId(ids),
    booleanValuesByRuleId(ids),
  ]);
  return rows.map(row =>
    toAutofillRule(
      row,
      tagMap.get(row.id) ?? [],
      numberMap.get(row.id) ?? [],
      booleanMap.get(row.id) ?? [],
    ));
}

export async function listAutofillRules(): Promise<AutofillRule[]> {
  const rows = await db
    .select()
    .from(autofillRules)
    .orderBy(asc(autofillRules.sortOrder), asc(autofillRules.createdAt));
  return hydrate(rows);
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

export async function createAutofillRule(input: CreateAutofillRuleInput): Promise<AutofillRule> {
  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(autofillRules)
      .values({
        name: input.name,
        conditions: input.conditions,
        setCategoryId: input.setCategoryId ?? null,
        sortOrder: input.sortOrder ?? 0,
      })
      .returning({
        id: autofillRules.id,
      });
    await setRuleTags(tx, row.id, input.tagIds ?? []);
    await setRuleNumberValues(tx, row.id, input.numberValues ?? []);
    await setRuleBooleanValues(tx, row.id, input.booleanValues ?? []);
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
      })
      .from(autofillRules)
      .where(eq(autofillRules.id, id));
    if (!existing) return false;

    const patch: Partial<
      Pick<AutofillRuleRow, "name" | "conditions" | "setCategoryId" | "sortOrder">
    > = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.conditions !== undefined) patch.conditions = input.conditions;
    if (input.setCategoryId !== undefined) patch.setCategoryId = input.setCategoryId ?? null;
    if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;

    if (Object.keys(patch).length > 0) {
      await tx.update(autofillRules).set(patch).where(eq(autofillRules.id, id));
    }

    if (input.tagIds !== undefined) await setRuleTags(tx, id, input.tagIds);
    if (input.numberValues !== undefined) await setRuleNumberValues(tx, id, input.numberValues);
    if (input.booleanValues !== undefined) await setRuleBooleanValues(tx, id, input.booleanValues);
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
