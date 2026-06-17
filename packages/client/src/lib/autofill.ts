import type {
  AutofillRule,
  BookmarkBooleanValue,
  BookmarkNumberValue,
} from "@eesimple/types";

/** The bookmark fields an autofill rule is matched against. */
export interface AutofillInput {
  url: string;
  title: string;
}

/** The values an autofill rule (or set of rules) suggests for the bookmark form. */
export interface AutofillResult {
  /** Category to assign, or `null` if no matching rule set one. */
  categoryId: string | null;
  tagIds: string[];
  numberValues: BookmarkNumberValue[];
  booleanValues: BookmarkBooleanValue[];
}

/** Extract the host of a URL with a leading `www.` removed, or `null` if it can't be parsed. */
function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  }
  catch {
    return null;
  }
}

/** Whether a single rule matches the given URL/Title. Invalid regex patterns never match. */
export function matchesRule(rule: AutofillRule, input: AutofillInput): boolean {
  const pattern = rule.pattern.trim();
  if (pattern === "") return false;

  // The `domain` operator always inspects the URL's host regardless of `field`.
  if (rule.operator === "domain") {
    const host = hostOf(input.url);
    return host !== null && host === pattern.replace(/^www\./i, "").toLowerCase();
  }

  const haystack = rule.field === "url" ? input.url : input.title;
  if (haystack === "") return false;

  switch (rule.operator) {
    case "contains":
      return haystack.toLowerCase().includes(pattern.toLowerCase());
    case "starts_with":
      return haystack.toLowerCase().startsWith(pattern.toLowerCase());
    case "regex":
      try {
        return new RegExp(pattern, "i").test(haystack);
      }
      catch {
        return false;
      }
    default:
      return false;
  }
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
  const tagIds = new Set<string>();
  const numberByProperty = new Map<string, number>();
  const booleanByProperty = new Map<string, boolean>();

  for (const rule of ordered) {
    if (!matchesRule(rule, input)) continue;
    if (rule.setCategoryId) categoryId = rule.setCategoryId;
    for (const tagId of rule.tagIds) tagIds.add(tagId);
    for (const entry of rule.numberValues) numberByProperty.set(entry.propertyId, entry.value);
    for (const entry of rule.booleanValues) booleanByProperty.set(entry.propertyId, entry.value);
  }

  return {
    categoryId,
    tagIds: [...tagIds],
    numberValues: [...numberByProperty].map(([propertyId, value]) => ({
      propertyId,
      value,
    })),
    booleanValues: [...booleanByProperty].map(([propertyId, value]) => ({
      propertyId,
      value,
    })),
  };
}
