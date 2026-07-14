import type { ConditionInput } from "./conditions.js";
import type {
  AutofillRule,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
} from "./index.js";

import { evaluateConditions } from "./conditions.js";

/** The bookmark fields known before a bookmark exists — all an autofill rule can match against. */
export interface AutofillMatchInput {
  url: string;
  title: string;
}

/** The merged values a set of matching autofill rules suggests for a new bookmark. */
export interface AutofillSuggestions {
  /** Category to assign, or `null` if no matching rule set one. */
  categoryId: string | null;
  /** Media type to assign, or `null` if no matching rule set one. */
  mediaTypeId: string | null;
  tagIds: string[];
  locationIds: string[];
  numberValues: BookmarkNumberValue[];
  booleanValues: BookmarkBooleanValue[];
  dateTimeValues: BookmarkDateTimeValue[];
}

/**
 * Project the pre-creation URL/title onto a full `ConditionInput`. Only the URL/title are known at
 * this point, so the bookmark's category, tags, and property values are projected as empty —
 * i.e. category/tag/property condition leaves can't fire yet and a rule effectively triggers on the
 * URL/title-satisfiable part of its tree.
 */
export function urlTitleConditionInput(input: AutofillMatchInput): ConditionInput {
  return {
    url: input.url,
    title: input.title,
    categoryId: "",
    tagIds: new Set(),
    locationIds: new Set(),
    youtubeChannelId: null,
    mediaTypeId: null,
    numberValues: new Map(),
    booleanValues: new Map(),
    dateTimeValues: new Map(),
    fileValues: new Set(),
    relationshipTypeIds: new Set(),
    languageUsages: [],
    choicesValues: new Map(),
    sectionsValues: new Map(),
    textValues: new Map(),
    hasFillableFields: false,
  };
}

/**
 * Combine every matching rule into a single set of suggested values. Tags/locations are unioned;
 * for single-valued targets (category, media type, a property set by more than one rule) the rule
 * with the highest `sortOrder` wins — rules are applied in ascending `sortOrder` (stable, so ties
 * keep the caller's order) and later writers overwrite earlier ones. This is the single autofill
 * merge shared by the client form prefill and server-side bookmark creation (e.g. Inbox approval).
 */
export function mergeMatchingAutofillRules(
  input: AutofillMatchInput,
  rules: AutofillRule[],
): AutofillSuggestions {
  const ordered = [...rules].sort((a, b) => a.sortOrder - b.sortOrder);
  const projection = urlTitleConditionInput(input);

  let categoryId: string | null = null;
  let mediaTypeId: string | null = null;
  const tagIds = new Set<string>();
  const locationIds = new Set<string>();
  const numberByProperty = new Map<string, number>();
  const booleanByProperty = new Map<string, boolean>();
  const dateTimeByProperty = new Map<string, string>();

  for (const rule of ordered) {
    if (!evaluateConditions(rule.conditions, projection)) continue;
    if (rule.setCategoryId) categoryId = rule.setCategoryId;
    if (rule.setMediaTypeId) mediaTypeId = rule.setMediaTypeId;
    for (const tagId of rule.tagIds) tagIds.add(tagId);
    for (const locationId of rule.locationIds) locationIds.add(locationId);
    for (const entry of rule.numberValues) numberByProperty.set(entry.propertyId, entry.value);
    for (const entry of rule.booleanValues) booleanByProperty.set(entry.propertyId, entry.value);
    for (const entry of rule.dateTimeValues) dateTimeByProperty.set(entry.propertyId, entry.value);
  }

  return {
    categoryId,
    mediaTypeId,
    tagIds: [...tagIds],
    locationIds: [...locationIds],
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
