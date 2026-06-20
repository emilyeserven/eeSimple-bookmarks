import type {
  BookmarkImageVisibility,
  HomepageSectionImageLayout,
} from "../lib/bookmarkColumns";
import type {
  Bookmark,
  CardDisplayRule,
  ConditionInput,
  TagDescendants,
} from "@eesimple/types";

import { useCallback, useMemo } from "react";

import { buildTagDescendants, evaluateConditions } from "@eesimple/types";

import { useCardDisplayRules } from "../hooks/useCardDisplayRules";
import { useTags } from "../hooks/useTags";

/**
 * Per-card display, fully resolved from the rule set. Every attribute is concrete (the Default rule
 * guarantees a baseline), and `provenance` records which rule supplied each attribute plus every rule
 * that matched — surfaced for the future "which rules apply to this bookmark" inspector.
 */
export interface ResolvedCardDisplay {
  hiddenCardFields: string[];
  imageMode: string;
  imageVisibility: BookmarkImageVisibility;
  imageLayout: HomepageSectionImageLayout;
  cornerOverlays: boolean;
  provenance: {
    /** Rule ids that matched this bookmark, in priority order (highest first). */
    matchedRuleIds: string[];
    /** For each attribute, the id of the rule that supplied its value (or null = built-in baseline). */
    source: Record<keyof Omit<ResolvedCardDisplay, "provenance">, string | null>;
  };
}

/** Hardcoded fallback used only if the Default rule is missing (e.g. before the boot seed runs). */
const BASELINE = {
  hiddenCardFields: [] as string[],
  imageMode: "natural",
  imageVisibility: "shown" as BookmarkImageVisibility,
  imageLayout: "above" as HomepageSectionImageLayout,
  cornerOverlays: true,
};

/**
 * Build the full {@link ConditionInput} projection of an EXISTING bookmark. Unlike `lib/autofill.ts`'s
 * add-time projection (which leaves category/tags/properties empty because only the URL/title are
 * known yet), every field is populated here so any condition leaf can fire against a saved bookmark.
 */
export function bookmarkToConditionInput(bookmark: Bookmark): ConditionInput {
  return {
    url: bookmark.url,
    title: bookmark.title,
    categoryId: bookmark.categoryId,
    tagIds: new Set(bookmark.tags.map(tag => tag.id)),
    youtubeChannelId: bookmark.youtubeChannel?.id ?? null,
    mediaTypeId: bookmark.mediaType?.id ?? null,
    numberValues: new Map(bookmark.numberValues.map(v => [v.propertyId, v.value])),
    booleanValues: new Map(bookmark.booleanValues.map(v => [v.propertyId, v.value])),
    dateTimeValues: new Map(bookmark.dateTimeValues.map(v => [v.propertyId, v.value])),
    fileValues: new Set(bookmark.fileValues.map(v => v.propertyId)),
  };
}

/** Whether a rule matches the bookmark. The Default rule always matches; other rules evaluate conditions. */
function ruleMatches(
  rule: CardDisplayRule,
  input: ConditionInput,
  tagDescendants: TagDescendants,
): boolean {
  if (rule.isDefault) return true;
  return evaluateConditions(rule.conditions, input, {
    tagDescendants,
  });
}

/**
 * Resolve a bookmark's per-card display by layering the matching rules. `rules` must be pre-sorted by
 * priority (highest first; the Default rule last). For each attribute the first matching rule that
 * sets a non-null value wins; the Default rule fills whatever remains; a hardcoded baseline covers the
 * (transient) case where no Default rule exists yet.
 */
export function resolveCardDisplay(
  bookmark: Bookmark,
  rules: CardDisplayRule[],
  tagDescendants: TagDescendants,
): ResolvedCardDisplay {
  const input = bookmarkToConditionInput(bookmark);

  const matchedRuleIds: string[] = [];
  let hiddenCardFields: string[] | null = null;
  let imageMode: string | null = null;
  let imageVisibility: BookmarkImageVisibility | null = null;
  let imageLayout: HomepageSectionImageLayout | null = null;
  let cornerOverlays: boolean | null = null;
  const source: ResolvedCardDisplay["provenance"]["source"] = {
    hiddenCardFields: null,
    imageMode: null,
    imageVisibility: null,
    imageLayout: null,
    cornerOverlays: null,
  };

  for (const rule of rules) {
    if (!ruleMatches(rule, input, tagDescendants)) continue;
    matchedRuleIds.push(rule.id);
    if (hiddenCardFields === null && rule.hiddenCardFields !== null) {
      hiddenCardFields = rule.hiddenCardFields;
      source.hiddenCardFields = rule.id;
    }
    if (imageMode === null && rule.imageMode !== null) {
      imageMode = rule.imageMode;
      source.imageMode = rule.id;
    }
    if (imageVisibility === null && rule.imageVisibility !== null) {
      imageVisibility = rule.imageVisibility;
      source.imageVisibility = rule.id;
    }
    if (imageLayout === null && rule.imageLayout !== null) {
      imageLayout = rule.imageLayout;
      source.imageLayout = rule.id;
    }
    if (cornerOverlays === null && rule.cornerOverlays !== null) {
      cornerOverlays = rule.cornerOverlays;
      source.cornerOverlays = rule.id;
    }
  }

  return {
    hiddenCardFields: hiddenCardFields ?? BASELINE.hiddenCardFields,
    imageMode: imageMode ?? BASELINE.imageMode,
    imageVisibility: imageVisibility ?? BASELINE.imageVisibility,
    imageLayout: imageLayout ?? BASELINE.imageLayout,
    cornerOverlays: cornerOverlays ?? BASELINE.cornerOverlays,
    provenance: {
      matchedRuleIds,
      source,
    },
  };
}

/** Sort rules into priority order: non-default first (lowest sortOrder first), the Default rule last. */
function byPriority(a: CardDisplayRule, b: CardDisplayRule): number {
  if (a.isDefault !== b.isDefault) return a.isDefault ? 1 : -1;
  return a.sortOrder - b.sortOrder;
}

/**
 * Returns a stable resolver `(bookmark) => ResolvedCardDisplay` for the current rule set. Loads the
 * rules + tags once (already cached by React Query) and builds the tag-cascade resolver a single time.
 */
export function useResolveCardDisplay(): (bookmark: Bookmark) => ResolvedCardDisplay {
  const {
    data: rules = [],
  } = useCardDisplayRules();
  const {
    data: tags = [],
  } = useTags();

  const sortedRules = useMemo(() => [...rules].sort(byPriority), [rules]);
  const tagDescendants = useMemo(
    () => buildTagDescendants(tags.map(tag => ({
      id: tag.id,
      parentId: tag.parentId,
    }))),
    [tags],
  );

  return useCallback(
    (bookmark: Bookmark) => resolveCardDisplay(bookmark, sortedRules, tagDescendants),
    [sortedRules, tagDescendants],
  );
}
