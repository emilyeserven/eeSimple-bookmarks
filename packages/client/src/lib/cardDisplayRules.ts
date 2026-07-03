import type {
  BookmarkImageVisibility,
  HomepageSectionImageLayout,
} from "../lib/bookmarkColumns";
import type {
  Bookmark,
  CardDisplayRule,
  CardFieldZones,
  CardZoneLayouts,
  ConditionInput,
  TagDescendants,
} from "@eesimple/types";

import { useCallback, useMemo } from "react";

import { buildTagDescendants, defaultCardZoneLayouts, emptyCardFieldZones, evaluateConditions } from "@eesimple/types";

import { STANDARD_CARD_FIELDS } from "./bookmarkCardFieldDefs";
import { defaultBodyZone } from "./bookmarkCardValues";
import { useCardDisplayRules } from "../hooks/useCardDisplayRules";
import { useTags } from "../hooks/useTags";

/**
 * Per-card display, fully resolved from the rule set. Every attribute is concrete (the Default rule
 * guarantees a baseline), and `provenance` records which rule supplied each attribute plus every rule
 * that matched — surfaced for the future "which rules apply to this bookmark" inspector.
 */
export interface ResolvedCardDisplay {
  fieldZones: CardFieldZones;
  cardZoneLayouts: CardZoneLayouts;
  imageMode: string;
  imageVisibility: BookmarkImageVisibility;
  imageLayout: HomepageSectionImageLayout;
  hideWebsiteForYouTube: boolean;
  provenance: {
    /** Rule ids that matched this bookmark, in priority order (highest first). */
    matchedRuleIds: string[];
    /** For each attribute, the id of the rule that supplied its value (or null = built-in baseline). */
    source: Record<keyof Omit<ResolvedCardDisplay, "provenance">, string | null>;
  };
}

/**
 * Hardcoded fallback used only if the Default rule is missing (e.g. before the boot seed runs). Also
 * reused by the rule-editor card preview to fill attributes a rule leaves to "inherit".
 */
/** Standard fields placed in the card body — the baseline `fieldZones` when no Default rule exists. */
function baselineFieldZones(): CardFieldZones {
  const zones = emptyCardFieldZones();
  for (const field of STANDARD_CARD_FIELDS) {
    zones[defaultBodyZone(field.key)].push({
      key: field.key,
    });
  }
  return zones;
}

export const BASELINE = {
  fieldZones: baselineFieldZones(),
  cardZoneLayouts: defaultCardZoneLayouts(),
  imageMode: "natural",
  imageVisibility: "shown" as BookmarkImageVisibility,
  imageLayout: "above" as HomepageSectionImageLayout,
  hideWebsiteForYouTube: false,
};

/**
 * Build the full {@link ConditionInput} projection of an EXISTING bookmark. Unlike `lib/autofill.ts`'s
 * add-time projection (which leaves category/tags/properties empty because only the URL/title are
 * known yet), every field is populated here so any condition leaf can fire against a saved bookmark.
 */
export function bookmarkToConditionInput(bookmark: Bookmark): ConditionInput {
  return {
    url: bookmark.url ?? "",
    title: bookmark.title,
    categoryId: bookmark.categoryId,
    tagIds: new Set(bookmark.tags.map(tag => tag.id)),
    locationIds: new Set(bookmark.locations.map(location => location.id)),
    youtubeChannelId: bookmark.youtubeChannel?.id ?? null,
    mediaTypeId: bookmark.mediaType?.id ?? null,
    numberValues: new Map([
      ...bookmark.numberValues.map(v => [v.propertyId, v.value] as const),
      ...bookmark.progressValues.map(v => [v.propertyId, v.current] as const),
    ]),
    booleanValues: new Map(bookmark.booleanValues.map(v => [v.propertyId, v.value])),
    dateTimeValues: new Map(bookmark.dateTimeValues.map(v => [v.propertyId, v.value])),
    fileValues: new Set(bookmark.fileValues.map(v => v.propertyId)),
    relationshipTypeIds: new Set(bookmark.relationships.map(r => r.relationshipTypeId)),
    languageUsages: bookmark.languageUsages.map(u => ({
      languageId: u.language.id,
      usageLevelId: u.level.id,
    })),
    choicesValues: new Map(bookmark.choicesValues.map(v => [v.propertyId, v.values])),
    sectionsValues: new Map(bookmark.sectionsValues.map(v => [v.propertyId, v])),
    textValues: new Map(bookmark.textValues.map(v => [v.propertyId, v.value])),
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

/** The overridable display attributes resolved by the layered merge — each nullable on a non-default rule. */
const MERGE_KEYS = [
  "fieldZones",
  "cardZoneLayouts",
  "imageMode",
  "imageVisibility",
  "imageLayout",
  "hideWebsiteForYouTube",
] as const;
type MergeKey = (typeof MERGE_KEYS)[number];
type MergedAttrs = Pick<CardDisplayRule, MergeKey>;

/** Fresh accumulator with every mergeable attribute unset (null). */
function emptyMergedAttrs(): MergedAttrs {
  return {
    fieldZones: null,
    cardZoneLayouts: null,
    imageMode: null,
    imageVisibility: null,
    imageLayout: null,
    hideWebsiteForYouTube: null,
  };
}

/**
 * Layered-merge step for one attribute: the first matching rule to set a non-null value wins it, and
 * records that rule's id as the provenance source. Generic over the key so `merged[key]`/`rule[key]`
 * stay the same type and assignment is checked.
 */
function takeFirstAttr<K extends MergeKey>(
  merged: MergedAttrs,
  source: Record<MergeKey, string | null>,
  rule: CardDisplayRule,
  key: K,
): void {
  if (merged[key] === null && rule[key] !== null) {
    merged[key] = rule[key];
    source[key] = rule.id;
  }
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
  const merged = emptyMergedAttrs();
  const source: ResolvedCardDisplay["provenance"]["source"] = {
    fieldZones: null,
    cardZoneLayouts: null,
    imageMode: null,
    imageVisibility: null,
    imageLayout: null,
    hideWebsiteForYouTube: null,
  };

  for (const rule of rules) {
    if (!ruleMatches(rule, input, tagDescendants)) continue;
    matchedRuleIds.push(rule.id);
    for (const key of MERGE_KEYS) takeFirstAttr(merged, source, rule, key);
  }

  return {
    fieldZones: merged.fieldZones ?? BASELINE.fieldZones,
    cardZoneLayouts: merged.cardZoneLayouts ?? BASELINE.cardZoneLayouts,
    imageMode: merged.imageMode ?? BASELINE.imageMode,
    imageVisibility: merged.imageVisibility ?? BASELINE.imageVisibility,
    imageLayout: merged.imageLayout ?? BASELINE.imageLayout,
    hideWebsiteForYouTube: merged.hideWebsiteForYouTube ?? BASELINE.hideWebsiteForYouTube,
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

/** The overridable display attributes, in display order, with the labels used by the rule editor. */
export const CARD_DISPLAY_ATTRS = [
  {
    key: "imageVisibility",
    label: "Images",
  },
  {
    key: "imageMode",
    label: "Aspect",
  },
  {
    key: "imageLayout",
    label: "Layout",
  },
  {
    key: "hideWebsiteForYouTube",
    label: "Hide website for YouTube",
  },
  {
    key: "fieldZones",
    label: "Card fields",
  },
  {
    key: "cardZoneLayouts",
    label: "Zone layout",
  },
] as const satisfies readonly {
  key: keyof ResolvedCardDisplay["provenance"]["source"];
  label: string;
}[];

/** A single attribute a rule sets, plus whether its value won or was overridden by a higher rule. */
export interface RuleAttrInspection {
  key: keyof ResolvedCardDisplay["provenance"]["source"];
  label: string;
  /** The raw value the rule declares for this attribute (formatted for display by the caller). */
  value: CardFieldZones | CardZoneLayouts | string | boolean;
  status: "applied" | "overridden";
  /** When overridden, the id of the higher-priority rule that supplied the final value. */
  overriddenBy: string | null;
}

/** One rule's contribution to a bookmark: whether it matched and which attributes it sets. */
export interface RuleInspection {
  rule: CardDisplayRule;
  matched: boolean;
  /** Only the attributes this rule sets (non-null), each flagged applied/overridden. */
  attrs: RuleAttrInspection[];
}

/** Full breakdown of how the rule set resolves for one bookmark, for the settings inspector. */
export interface BookmarkRuleInspection {
  resolved: ResolvedCardDisplay;
  /** Every rule in priority order (matching the input order), each with its per-attribute status. */
  rules: RuleInspection[];
}

/**
 * Inspect how `rules` resolve for one bookmark: for each rule report whether it matched and, for each
 * attribute it sets, whether that value was applied or overridden by a higher-priority rule. Built as
 * a view over {@link resolveCardDisplay}'s provenance so the inspector and the live cards agree.
 * `rules` must be pre-sorted by priority (highest first; the Default rule last).
 */
export function inspectBookmarkRules(
  bookmark: Bookmark,
  rules: CardDisplayRule[],
  tagDescendants: TagDescendants,
): BookmarkRuleInspection {
  const resolved = resolveCardDisplay(bookmark, rules, tagDescendants);
  const input = bookmarkToConditionInput(bookmark);

  const ruleInspections = rules.map((rule): RuleInspection => {
    const attrs: RuleAttrInspection[] = [];
    for (const {
      key, label,
    } of CARD_DISPLAY_ATTRS) {
      const value = rule[key];
      if (value === null) continue;
      const winner = resolved.provenance.source[key];
      const applied = winner === rule.id;
      attrs.push({
        key,
        label,
        value,
        status: applied ? "applied" : "overridden",
        overriddenBy: applied ? null : winner,
      });
    }
    return {
      rule,
      matched: ruleMatches(rule, input, tagDescendants),
      attrs,
    };
  });

  return {
    resolved,
    rules: ruleInspections,
  };
}

/**
 * Returns a stable resolver `(bookmark) => ResolvedCardDisplay` for the current rule set. Loads the
 * rules + tags once (already cached by React Query) and builds the tag-cascade resolver a single time.
 *
 * `isPending` is true only when neither rules nor tags have been fetched yet (cold React Query cache).
 * Callers that render images should suppress them while pending to prevent an aspect-ratio flash:
 * without rules the resolver falls back to BASELINE.imageMode ("natural"), so an image would render
 * at the wrong aspect ratio and then jump when the rules arrive.
 */
export function useResolveCardDisplay(): {
  resolve: (bookmark: Bookmark) => ResolvedCardDisplay;
  isPending: boolean;
} {
  const {
    data: rules = [],
    isPending: rulesPending,
  } = useCardDisplayRules();
  const {
    data: tags = [],
    isPending: tagsPending,
  } = useTags();

  const sortedRules = useMemo(() => [...rules].sort(byPriority), [rules]);
  const tagDescendants = useMemo(
    () => buildTagDescendants(tags.map(tag => ({
      id: tag.id,
      parentId: tag.parentId,
    }))),
    [tags],
  );

  const resolve = useCallback(
    (bookmark: Bookmark) => resolveCardDisplay(bookmark, sortedRules, tagDescendants),
    [sortedRules, tagDescendants],
  );

  return {
    resolve,
    isPending: rulesPending || tagsPending,
  };
}

/**
 * The Card Display Rules that match `bookmark`, in priority order (highest first; the Default rule —
 * which always matches — last). A thin view over {@link resolveCardDisplay}'s `matchedRuleIds`
 * provenance, mapped back to the full rule objects, so it agrees with the live cards. Powers the
 * CMD+K "jump to the rules that style this card" group. Returns `[]` when `bookmark` is undefined.
 */
export function useMatchingCardDisplayRules(bookmark: Bookmark | undefined): CardDisplayRule[] {
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

  return useMemo(() => {
    if (!bookmark) return [];
    const byId = new Map(rules.map(rule => [rule.id, rule]));
    const resolved = resolveCardDisplay(bookmark, sortedRules, tagDescendants);
    return resolved.provenance.matchedRuleIds
      .map(id => byId.get(id))
      .filter((rule): rule is CardDisplayRule => rule !== undefined);
  }, [bookmark, rules, sortedRules, tagDescendants]);
}
