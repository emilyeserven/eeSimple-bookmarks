import type {
  AutofillRule,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  ConditionInput,
} from "@eesimple/types";

import { evaluateConditions } from "@eesimple/types";

/** The bookmark fields an autofill rule is matched against. */
export interface AutofillInput {
  url: string;
  title: string;
}

/** The values an autofill rule (or set of rules) suggests for the bookmark form. */
export interface AutofillResult {
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
 * Whether a rule's conditions are satisfied by what's known when adding a bookmark. Only the
 * URL/title are available at this point, so the bookmark's category, tags, and property values are
 * projected as empty — i.e. category/tag/property condition leaves can't fire yet and a rule
 * effectively triggers on the URL/title-satisfiable part of its tree.
 */
export function matchesRule(rule: AutofillRule, input: AutofillInput): boolean {
  const projection: ConditionInput = {
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
    choicesValues: new Map(),
    sectionsValues: new Map(),
    textValues: new Map(),
  };
  return evaluateConditions(rule.conditions, projection);
}

/**
 * Combine every matching rule into a single set of suggested values. Tags are unioned; for
 * single-valued targets (category, a property set by more than one rule) the rule with the highest
 * `sortOrder` wins — rules are applied in ascending `sortOrder` so later writers overwrite earlier
 * ones.
 */
export function applyAutofill(input: AutofillInput, rules: AutofillRule[]): AutofillResult {
  const ordered = [...rules].sort((a, b) => a.sortOrder - b.sortOrder);

  let categoryId: string | null = null;
  let mediaTypeId: string | null = null;
  const tagIds = new Set<string>();
  const locationIds = new Set<string>();
  const numberByProperty = new Map<string, number>();
  const booleanByProperty = new Map<string, boolean>();
  const dateTimeByProperty = new Map<string, string>();

  for (const rule of ordered) {
    if (!matchesRule(rule, input)) continue;
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
