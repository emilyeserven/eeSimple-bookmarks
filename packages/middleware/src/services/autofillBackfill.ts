import { and, eq } from "drizzle-orm";
import type {
  AutofillApplyInput,
  AutofillApplyResult,
  AutofillBackfillEntry,
  AutofillBackfillResult,
  AutofillRule,
  Bookmark,
  GlobalAutofillBackfillGroup,
  GlobalAutofillBackfillResult,
} from "@eesimple/types";
import { evaluateConditions } from "@eesimple/types";
import { db } from "@/db";
import {
  autofillRuleExemptions,
  bookmarkBooleanValues,
  bookmarkDateTimeValues,
  bookmarkLocations,
  bookmarkNumberValues,
  bookmarks,
  bookmarkTags,
} from "@/db/schema";
import { getBookmarkEvaluationData, invalidateBookmarkCache } from "@/services/bookmarkCache";
import { hydrateBookmarkRows } from "@/services/bookmarkHydration";
import { byPriorityThenNewest, getAutofillRule, listAutofillRules } from "@/services/autofillRules";
import { getExcludedFromBackfillTagIds } from "@/services/tags";
import { recomputeCalculatedValues } from "@/services/bookmarkWrites";

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
      || rule.locationIds.length > 0
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

  const existingLocationIds = new Set(bookmark.locations.map(l => l.id));
  const effectiveLocationIds = rule.locationIds.filter(id => !bookmark.blacklistedLocationIds.includes(id));
  if (effectiveLocationIds.some(id => !existingLocationIds.has(id))) return true;

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
    baseRows, conditionInputs, evaluateOptions,
  } = await getBookmarkEvaluationData();

  const matchingRows = baseRows.filter((row) => {
    const ci = conditionInputs.get(row.id);
    return ci
      ? evaluateConditions(rule.conditions, ci, evaluateOptions)
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
    baseRows, conditionInputs, evaluateOptions,
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
    if (!ci || !evaluateConditions(rule.conditions, ci, evaluateOptions)) {
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

      const locationsToInsert = rule.locationIds.filter(id => !bookmark.blacklistedLocationIds.includes(id));
      if (locationsToInsert.length > 0) {
        await tx
          .insert(bookmarkLocations)
          .values(locationsToInsert.map(locationId => ({
            bookmarkId: bookmark.id,
            locationId,
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
    baseRows, conditionInputs, evaluateOptions,
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
        ? evaluateConditions(rule.conditions, ci, evaluateOptions)
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
