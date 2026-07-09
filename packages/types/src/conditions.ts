import type { BookmarkSectionsValue, SectionEntryType } from "./customProperties.js";

/**
 * Composable condition tree — a serializable predicate model shared by the Autofill rule
 * "when" and the Homepage filter.
 *
 * A tree is a `group` node (AND/OR) of child nodes; leaves test a bookmark's url/title, its
 * category, its tags, or a custom-property value. The model is intentionally recursive
 * (`group` nodes can nest) even though the current UI only builds a single top-level group,
 * so nested groups can be added later without a data migration.
 *
 * This module is pure — no dependencies, no side effects — so it can run unchanged in both the
 * Fastify API (`@eesimple/middleware`) and the browser (`@eesimple/client`).
 */

/** Which bookmark text field a `match` leaf inspects. */
export type ConditionMatchField = "url" | "title";

/**
 * How a `match` leaf's `pattern` is compared to the chosen field:
 * - `contains` — field contains the pattern (case-insensitive substring).
 * - `starts_with` — field starts with the pattern (case-insensitive).
 * - `regex` — pattern is a JavaScript regular expression (case-insensitive); invalid patterns
 *   never match.
 * - `domain` — the URL's host (leading `www.` stripped) equals the pattern; implies the `url` field.
 */
export type ConditionMatchOperator = "contains" | "starts_with" | "regex" | "domain";

/** Predicate applied to a number/calculate custom-property value inside a `property` leaf. */
export type NumberPredicate
  = | { kind: "range";
    min: number | null;
    max: number | null; }
    | { kind: "presence";
      mode: "has" | "missing"; };

/** Predicate applied to a boolean custom-property value inside a `property` leaf. */
export type BooleanPredicate
  = | { kind: "value";
    value: boolean; }
    | { kind: "presence";
      mode: "has" | "missing"; };

/**
 * Predicate applied to a `datetime` custom-property value inside a `property` leaf. Bounds are the
 * value's canonical string encoding (`"YYYY-MM-DD"` / `"HH:MM"` / `"YYYY-MM-DDTHH:MM"`); `range`
 * compares them lexicographically, which is correct for those encodings. Both bounds are inclusive
 * and either may be `null` (open-ended).
 */
export type DateTimePredicate
  = | { kind: "range";
    from: string | null;
    to: string | null; }
    | { kind: "presence";
      mode: "has" | "missing"; };

/**
 * Predicate applied to an `image`/`file` custom-property value inside a `property` leaf. These values
 * are binary blobs, so only their presence can be matched (`has` a file / `missing` a file).
 */
export interface FilePredicate { kind: "presence";
  mode: "has" | "missing"; }

/**
 * Predicate applied to a `choices` custom-property value inside a `property` leaf:
 * - `includes` — the bookmark has at least one of the listed values selected.
 * - `presence` — whether any value is selected (`has`) or none is selected (`missing`).
 */
export type ChoicesPredicate
  = | { kind: "includes";
    values: string[]; }
    | { kind: "presence";
      mode: "has" | "missing"; };

/** Leaf: text match against the bookmark's url/title. */
export interface MatchCondition {
  type: "match";
  field: ConditionMatchField;
  operator: ConditionMatchOperator;
  pattern: string;
}

/** Leaf: the bookmark's category is one of `categoryIds` (empty list never matches). */
export interface CategoryCondition {
  type: "category";
  categoryIds: string[];
}

/**
 * Leaf: the bookmark's host (its URL's hostname with a leading `www.` stripped) is one of
 * `domains`. Domains are stored normalized (lowercase, no `www.`); an empty list never matches.
 * This is the dedicated "Website" filter — it supersedes the legacy `match` leaf's `domain`
 * operator, which is retained only so older stored trees still evaluate.
 */
export interface WebsiteCondition {
  type: "website";
  domains: string[];
}

/**
 * Leaf: the bookmark carries one of `tagIds`. Cascade (a selected parent also matches its
 * descendants) is applied at EVALUATION time, so `tagIds` stores exactly what the user picked.
 *
 * `cascadeTagIds` is the subset of `tagIds` that match their whole subtree (the per-item "cascade"
 * checkbox). **Absent = legacy**: reproduces the old always-cascade behavior (every selected id
 * cascades), so existing saved conditions are unchanged. A newly-selected parent defaults to exact
 * (not in this set).
 */
export interface TagCondition {
  type: "tag";
  tagIds: string[];
  cascadeTagIds?: string[];
}

/**
 * Leaf: the bookmark carries one of `locationIds`. Cascade (a selected parent also matches its
 * descendants) is applied at EVALUATION time, so `locationIds` stores exactly what the user picked.
 * `cascadeLocationIds` mirrors {@link TagCondition.cascadeTagIds} (absent = legacy always-cascade).
 */
export interface LocationCondition {
  type: "location";
  locationIds: string[];
  cascadeLocationIds?: string[];
}

/**
 * Leaf: the bookmark is linked to one of `channelIds`. An empty list never matches.
 */
export interface YouTubeChannelCondition {
  type: "youtube-channel";
  channelIds: string[];
}

/**
 * Leaf: the bookmark's media type is one of `mediaTypeIds`. An empty list never matches.
 * `cascadeMediaTypeIds` is the subset that match their subtree (media types are a `parentId` tree);
 * **absent = legacy exact match** (no cascade), preserving existing conditions.
 */
export interface MediaTypeCondition {
  type: "media-type";
  mediaTypeIds: string[];
  cascadeMediaTypeIds?: string[];
}

/**
 * Leaf: the bookmark carries one of `genreMoodIds` (any-of; a bookmark can have several Genres &
 * Moods). `cascadeGenreMoodIds` is the subset that match their subtree (Genres & Moods are a
 * `parentId` tree); **absent = legacy exact match** (no cascade), preserving existing conditions.
 */
export interface GenreMoodCondition {
  type: "genre-mood";
  genreMoodIds: string[];
  cascadeGenreMoodIds?: string[];
}

/**
 * Leaf: the bookmark carries one of `termIds` (any-of) from the user-configurable taxonomy
 * `taxonomyId`. `cascadeTermIds` is the subset that match their subtree (a hierarchical taxonomy is a
 * `parentId` tree); **absent = exact match** (no cascade). `taxonomyId` scopes the editor's term
 * choices; evaluation matches the flat term-id set (term ids are globally unique). The generic
 * successor to {@link GenreMoodCondition}.
 */
export interface TaxonomyCondition {
  type: "taxonomy";
  taxonomyId: string;
  termIds: string[];
  cascadeTermIds?: string[];
}

/**
 * Leaf: the bookmark participates in a relationship whose type is one of `relationshipTypeIds`
 * (regardless of direction or the other bookmark). An empty list never matches.
 */
export interface RelationshipTypeCondition {
  type: "relationship-type";
  relationshipTypeIds: string[];
}

/**
 * Leaf: the bookmark carries a language usage matching both constraints on a *single* association
 * row — its language is one of `languageIds` (or `languageIds` is empty = any) AND its usage level is
 * one of `usageLevelIds` (or `usageLevelIds` is empty = any). Matching per-row (not cross-product)
 * means a bookmark with English/Dub + Spanish/Subtitles does NOT match {English, Subtitles}. Both
 * lists empty never matches.
 */
export interface LanguageUsageCondition {
  type: "language-usage";
  languageIds: string[];
  usageLevelIds: string[];
}

/**
 * The filterable value kinds a {@link PropertyCondition} predicate can discriminate on. A subset of
 * the custom-property types — `calculate`/`ratingScale` filter as `number`, and `image` is unfiltered.
 * Source of truth for the matching JSON-Schema `oneOf` branches in the middleware.
 */
export const CONDITION_VALUE_KINDS = ["number", "boolean", "datetime", "file", "choices", "sections", "text"] as const;

/** The discriminant of a {@link PropertyCondition} predicate. Derived from {@link CONDITION_VALUE_KINDS}. */
export type ConditionValueKind = typeof CONDITION_VALUE_KINDS[number];

/**
 * Predicate applied to a `text` custom-property value inside a `property` leaf:
 * - `presence` — whether a non-empty value is stored (`has`) or none/empty (`missing`).
 * - `contains` — value contains the given pattern (case-insensitive).
 */
export type TextPredicate
  = | { kind: "presence";
    mode: "has" | "missing"; }
    | { kind: "contains";
      pattern: string; };

/**
 * Predicate applied to a `sections` custom-property value inside a `property` leaf:
 * - `presence` — whether any sections exist (`has`) or none (`missing`).
 * - `sectionType` — at least one section has one of the listed types.
 * - `exhaustive` — the exhaustive flag equals `value`.
 */
export type SectionsPredicate
  = | { kind: "presence";
    mode: "has" | "missing"; }
    | { kind: "sectionType";
      types: SectionEntryType[]; }
      | { kind: "exhaustive";
        value: boolean; };

/** Leaf: a predicate on a single custom property's value. */
export interface PropertyCondition {
  type: "property";
  propertyId: string;
  predicate:
    | { valueKind: "number";
      predicate: NumberPredicate; }
      | { valueKind: "boolean";
        predicate: BooleanPredicate; }
        | { valueKind: "datetime";
          predicate: DateTimePredicate; }
          | { valueKind: "file";
            predicate: FilePredicate; }
            | { valueKind: "choices";
              predicate: ChoicesPredicate; }
              | { valueKind: "sections";
                predicate: SectionsPredicate; }
                | { valueKind: "text";
                  predicate: TextPredicate; };
}

/** Branch: combines its children with `and`/`or`. The only node that nests. */
export interface ConditionGroup {
  type: "group";
  combinator: "and" | "or";
  children: ConditionNode[];
}

/** Any node in a condition tree. */
export type ConditionNode
  = | ConditionGroup
    | MatchCondition
    | CategoryCondition
    | WebsiteCondition
    | TagCondition
    | LocationCondition
    | YouTubeChannelCondition
    | MediaTypeCondition
    | GenreMoodCondition
    | TaxonomyCondition
    | RelationshipTypeCondition
    | LanguageUsageCondition
    | PropertyCondition;

/** The persisted root is always a group, so the AND/OR combinator always has a home. */
export type ConditionTree = ConditionGroup;

/** A fresh, empty condition tree (an empty AND group — matches nothing). */
export function emptyConditionTree(): ConditionTree {
  return {
    type: "group",
    combinator: "and",
    children: [],
  };
}

/** Normalized projection of a bookmark that the evaluator inspects. */
export interface ConditionInput {
  url: string;
  title: string;
  /**
   * All of the bookmark's language-labelled name values (values only) — matched alongside `title`,
   * so a `title` rule written in any script fires on a bookmark named in another. Absent/empty
   * when the input isn't a real bookmark (URL/title-only matching) or the bookmark has no
   * `entity_names` rows.
   */
  names?: string[];
  /** The bookmark's resolved category id. */
  categoryId: string;
  /** The bookmark's own tag ids (NOT expanded for cascade). */
  tagIds: Set<string>;
  /** The bookmark's own location ids (NOT expanded for cascade). */
  locationIds: Set<string>;
  /** The bookmark's YouTube channel id, or `null` when not a YouTube video. */
  youtubeChannelId: string | null;
  /** The bookmark's media type id, or `null` when not set. */
  mediaTypeId: string | null;
  /** The bookmark's own Genres & Moods entry ids (NOT expanded for cascade). */
  genreMoodIds: Set<string>;
  /**
   * The bookmark's own user-taxonomy term ids across all taxonomies (NOT expanded for cascade).
   * Absent/empty when the input isn't a real bookmark or carries no taxonomy terms — a
   * {@link TaxonomyCondition} then never matches.
   */
  taxonomyTermIds?: Set<string>;
  /** Type ids of every relationship the bookmark participates in (presence matching). */
  relationshipTypeIds: Set<string>;
  /** The bookmark's (language, usage level) association pairs, for language-usage matching. */
  languageUsages: { languageId: string;
    usageLevelId: string; }[];
  /** Number/calculate custom-property values, keyed by property id. */
  numberValues: Map<string, number>;
  /** Boolean custom-property values, keyed by property id. */
  booleanValues: Map<string, boolean>;
  /** Date/time custom-property values (canonical string encoding), keyed by property id. */
  dateTimeValues: Map<string, string>;
  /** Property ids of `image`/`file` properties that have a stored value (presence matching only). */
  fileValues: Set<string>;
  /** Choices custom-property selected values, keyed by property id. */
  choicesValues: Map<string, string[]>;
  /** Sections custom-property values, keyed by property id. */
  sectionsValues: Map<string, BookmarkSectionsValue>;
  /** Text custom-property values (plain strings), keyed by property id. */
  textValues: Map<string, string>;
}

/** Resolves a tag id to the inclusive set of its descendant ids (for cascade matching). */
export type TagDescendants = (tagId: string) => Set<string>;

/** Optional dependencies for evaluation. */
export interface EvaluateOptions {
  /** Tag cascade resolver; when omitted, a tag leaf matches only the exact ids selected. */
  tagDescendants?: TagDescendants;
  /** Location cascade resolver; when omitted, a location leaf matches only the exact ids selected. */
  locationDescendants?: TagDescendants;
  /** Media-type cascade resolver; when omitted, a media-type leaf matches only the exact ids selected. */
  mediaTypeDescendants?: TagDescendants;
  /** Genre & Mood cascade resolver; when omitted, a genre-mood leaf matches only the exact ids selected. */
  genreMoodDescendants?: TagDescendants;
  /** Taxonomy-term cascade resolver; when omitted, a taxonomy leaf matches only the exact ids selected. */
  taxonomyTermDescendants?: TagDescendants;
}

/**
 * Build a {@link TagDescendants} resolver from a flat list of tags. Each tag's descendant set
 * is computed once and cached; the result is inclusive (a tag is its own descendant).
 */
export function buildTagDescendants(
  tags: readonly { id: string;
    parentId: string | null; }[],
): TagDescendants {
  const childrenByParent = new Map<string, string[]>();
  for (const tag of tags) {
    if (tag.parentId === null) continue;
    const siblings = childrenByParent.get(tag.parentId);
    if (siblings) siblings.push(tag.id);
    else childrenByParent.set(tag.parentId, [tag.id]);
  }

  const cache = new Map<string, Set<string>>();
  function collect(id: string): Set<string> {
    const cached = cache.get(id);
    if (cached) return cached;
    const result = new Set<string>([id]);
    // Seed the cache before recursing so a malformed cycle can't loop forever.
    cache.set(id, result);
    for (const childId of childrenByParent.get(id) ?? []) {
      for (const descendantId of collect(childId)) result.add(descendantId);
    }
    return result;
  }

  return collect;
}

/**
 * Build a descendant resolver for the Locations tree. Locations share the same `{ id, parentId }`
 * shape as tags, so this is just {@link buildTagDescendants} under a clearer name.
 */
export const buildLocationDescendants = buildTagDescendants;

/**
 * Build a descendant resolver for the Media Types tree — same `{ id, parentId }` shape as tags, so
 * it aliases {@link buildTagDescendants}. Used for the per-item media-type cascade toggle.
 */
export const buildMediaTypeDescendants = buildTagDescendants;

/**
 * Build a descendant resolver for the Genres & Moods tree — same `{ id, parentId }` shape as tags,
 * so it aliases {@link buildTagDescendants}. Used for the per-item genre-mood cascade toggle.
 */
export const buildGenreMoodDescendants = buildTagDescendants;

/**
 * Build a descendant resolver for a user taxonomy's term tree — same `{ id, parentId }` shape as
 * tags, so it aliases {@link buildTagDescendants}. Used for the per-item taxonomy cascade toggle.
 */
export const buildTaxonomyTermDescendants = buildTagDescendants;

/** Extract a URL's host with a leading `www.` removed, or `null` if it can't be parsed. */
function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  }
  catch {
    return null;
  }
}

/** Normalize a domain to the form `hostOf` produces (lowercase, no leading `www.`). */
export function normalizeDomain(domain: string): string {
  return domain.trim().replace(/^www\./i, "").toLowerCase();
}

function evaluateWebsite(condition: WebsiteCondition, input: ConditionInput): boolean {
  const host = hostOf(input.url);
  if (host === null) return false;
  return condition.domains.some(domain => normalizeDomain(domain) === host);
}

function evaluateMatch(condition: MatchCondition, input: ConditionInput): boolean {
  const pattern = condition.pattern.trim();
  if (pattern === "") return false;

  // The `domain` operator always inspects the URL's host regardless of `field`.
  if (condition.operator === "domain") {
    const host = hostOf(input.url);
    return host !== null && host === pattern.replace(/^www\./i, "").toLowerCase();
  }

  // The `title` field also matches against every language-labelled name (when present), so a rule
  // written in any name form fires on a title in another script and vice-versa. `url` has no name
  // forms.
  const haystacks = condition.field === "url"
    ? [input.url]
    : [input.title, ...(input.names ?? [])];
  const candidates = haystacks.filter(text => text !== "");
  if (candidates.length === 0) return false;

  switch (condition.operator) {
    case "contains":
      return candidates.some(text => text.toLowerCase().includes(pattern.toLowerCase()));
    case "starts_with":
      return candidates.some(text => text.toLowerCase().startsWith(pattern.toLowerCase()));
    case "regex":
      try {
        const re = new RegExp(pattern, "i");
        return candidates.some(text => re.test(text));
      }
      catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * The candidate id set matched by one selected hierarchical id: its inclusive subtree when the id is
 * flagged to cascade (the per-item checkbox) and a resolver is available, else just the id itself
 * (exact). `cascadeIds === undefined` means the leaf predates the per-item flag — `legacyCascade`
 * supplies that leaf type's historical default (Tags/Locations cascaded everything, Media
 * Types/Genres & Moods were exact), so existing conditions evaluate exactly as before.
 */
function cascadeCandidates(
  id: string,
  cascadeIds: string[] | undefined,
  resolve: TagDescendants | undefined,
  legacyCascade: boolean,
): Set<string> {
  const shouldCascade = cascadeIds === undefined ? legacyCascade : cascadeIds.includes(id);
  return resolve && shouldCascade ? resolve(id) : new Set([id]);
}

function evaluateTag(
  condition: TagCondition,
  input: ConditionInput,
  options: EvaluateOptions | undefined,
): boolean {
  if (condition.tagIds.length === 0) return false;
  for (const tagId of condition.tagIds) {
    const candidates = cascadeCandidates(tagId, condition.cascadeTagIds, options?.tagDescendants, true);
    for (const id of candidates) {
      if (input.tagIds.has(id)) return true;
    }
  }
  return false;
}

function evaluateNumberPredicate(
  predicate: NumberPredicate,
  hasValue: boolean,
  value: number | undefined,
): boolean {
  if (predicate.kind === "presence") {
    return predicate.mode === "has" ? hasValue : !hasValue;
  }
  if (!hasValue || value === undefined) return false;
  if (predicate.min !== null && value < predicate.min) return false;
  if (predicate.max !== null && value > predicate.max) return false;
  return true;
}

function evaluateBooleanPredicate(
  predicate: BooleanPredicate,
  hasValue: boolean,
  value: boolean | undefined,
): boolean {
  if (predicate.kind === "presence") {
    return predicate.mode === "has" ? hasValue : !hasValue;
  }
  if (!hasValue || value === undefined) return false;
  return value === predicate.value;
}

function evaluateDateTimePredicate(
  predicate: DateTimePredicate,
  hasValue: boolean,
  value: string | undefined,
): boolean {
  if (predicate.kind === "presence") {
    return predicate.mode === "has" ? hasValue : !hasValue;
  }
  if (!hasValue || value === undefined) return false;
  if (predicate.from !== null && value < predicate.from) return false;
  if (predicate.to !== null && value > predicate.to) return false;
  return true;
}

function evaluateLocation(
  condition: LocationCondition,
  input: ConditionInput,
  options: EvaluateOptions | undefined,
): boolean {
  if (condition.locationIds.length === 0) return false;
  for (const locationId of condition.locationIds) {
    const candidates = cascadeCandidates(locationId, condition.cascadeLocationIds, options?.locationDescendants, true);
    for (const id of candidates) {
      if (input.locationIds.has(id)) return true;
    }
  }
  return false;
}

function evaluateYoutubeChannel(condition: YouTubeChannelCondition, input: ConditionInput): boolean {
  if (condition.channelIds.length === 0) return false;
  return input.youtubeChannelId !== null && condition.channelIds.includes(input.youtubeChannelId);
}

function evaluateMediaType(
  condition: MediaTypeCondition,
  input: ConditionInput,
  options: EvaluateOptions | undefined,
): boolean {
  if (condition.mediaTypeIds.length === 0) return false;
  if (input.mediaTypeId === null) return false;
  for (const mediaTypeId of condition.mediaTypeIds) {
    const candidates = cascadeCandidates(mediaTypeId, condition.cascadeMediaTypeIds, options?.mediaTypeDescendants, false);
    if (candidates.has(input.mediaTypeId)) return true;
  }
  return false;
}

function evaluateRelationshipType(
  condition: RelationshipTypeCondition,
  input: ConditionInput,
): boolean {
  if (condition.relationshipTypeIds.length === 0) return false;
  return condition.relationshipTypeIds.some(id => input.relationshipTypeIds.has(id));
}

function evaluateLanguageUsage(condition: LanguageUsageCondition, input: ConditionInput): boolean {
  const {
    languageIds, usageLevelIds,
  } = condition;
  if (languageIds.length === 0 && usageLevelIds.length === 0) return false;
  return input.languageUsages.some(usage =>
    (languageIds.length === 0 || languageIds.includes(usage.languageId))
    && (usageLevelIds.length === 0 || usageLevelIds.includes(usage.usageLevelId)));
}

function evaluateGenreMood(
  condition: GenreMoodCondition,
  input: ConditionInput,
  options: EvaluateOptions | undefined,
): boolean {
  if (condition.genreMoodIds.length === 0) return false;
  for (const genreMoodId of condition.genreMoodIds) {
    const candidates = cascadeCandidates(genreMoodId, condition.cascadeGenreMoodIds, options?.genreMoodDescendants, false);
    for (const id of candidates) {
      if (input.genreMoodIds.has(id)) return true;
    }
  }
  return false;
}

function evaluateTaxonomy(
  condition: TaxonomyCondition,
  input: ConditionInput,
  options: EvaluateOptions | undefined,
): boolean {
  if (condition.termIds.length === 0) return false;
  const owned = input.taxonomyTermIds;
  if (!owned || owned.size === 0) return false;
  for (const termId of condition.termIds) {
    const candidates = cascadeCandidates(termId, condition.cascadeTermIds, options?.taxonomyTermDescendants, false);
    for (const id of candidates) {
      if (owned.has(id)) return true;
    }
  }
  return false;
}

function evaluateChoicesPredicate(
  predicate: ChoicesPredicate,
  values: string[],
): boolean {
  if (predicate.kind === "presence") {
    return predicate.mode === "has" ? values.length > 0 : values.length === 0;
  }
  return predicate.values.some(v => values.includes(v));
}

function evaluateSectionsPredicate(
  predicate: SectionsPredicate,
  value: BookmarkSectionsValue | undefined,
): boolean {
  if (predicate.kind === "presence") {
    const has = value !== undefined && value.sections.length > 0;
    return predicate.mode === "has" ? has : !has;
  }
  if (predicate.kind === "sectionType") {
    if (!value || value.sections.length === 0) return false;
    return predicate.types.some(t => value.sections.some(s => s.type === t));
  }
  // exhaustive
  return value !== undefined && value.exhaustive === predicate.value;
}

function evaluateProperty(condition: PropertyCondition, input: ConditionInput): boolean {
  if (condition.predicate.valueKind === "number") {
    return evaluateNumberPredicate(
      condition.predicate.predicate,
      input.numberValues.has(condition.propertyId),
      input.numberValues.get(condition.propertyId),
    );
  }
  if (condition.predicate.valueKind === "datetime") {
    return evaluateDateTimePredicate(
      condition.predicate.predicate,
      input.dateTimeValues.has(condition.propertyId),
      input.dateTimeValues.get(condition.propertyId),
    );
  }
  if (condition.predicate.valueKind === "file") {
    const hasValue = input.fileValues.has(condition.propertyId);
    return condition.predicate.predicate.mode === "has" ? hasValue : !hasValue;
  }
  if (condition.predicate.valueKind === "choices") {
    return evaluateChoicesPredicate(
      condition.predicate.predicate,
      input.choicesValues.get(condition.propertyId) ?? [],
    );
  }
  if (condition.predicate.valueKind === "sections") {
    return evaluateSectionsPredicate(
      condition.predicate.predicate,
      input.sectionsValues.get(condition.propertyId),
    );
  }
  if (condition.predicate.valueKind === "text") {
    const value = input.textValues.get(condition.propertyId);
    const hasValue = value !== undefined && value.length > 0;
    if (condition.predicate.predicate.kind === "presence") {
      return condition.predicate.predicate.mode === "has" ? hasValue : !hasValue;
    }
    if (!hasValue || value === undefined) return false;
    return value.toLowerCase().includes(condition.predicate.predicate.pattern.toLowerCase());
  }
  return evaluateBooleanPredicate(
    condition.predicate.predicate,
    input.booleanValues.has(condition.propertyId),
    input.booleanValues.get(condition.propertyId),
  );
}

/**
 * Evaluate a condition node against a bookmark projection. An empty group matches nothing
 * (so an unconfigured filter selects no bookmarks).
 */
export function evaluateConditions(
  node: ConditionNode,
  input: ConditionInput,
  options?: EvaluateOptions,
): boolean {
  switch (node.type) {
    case "group": {
      if (node.children.length === 0) return false;
      return node.combinator === "and"
        ? node.children.every(child => evaluateConditions(child, input, options))
        : node.children.some(child => evaluateConditions(child, input, options));
    }
    case "match":
      return evaluateMatch(node, input);
    case "category":
      return node.categoryIds.includes(input.categoryId);
    case "website":
      return evaluateWebsite(node, input);
    case "tag":
      return evaluateTag(node, input, options);
    case "location":
      return evaluateLocation(node, input, options);
    case "youtube-channel":
      return evaluateYoutubeChannel(node, input);
    case "media-type":
      return evaluateMediaType(node, input, options);
    case "genre-mood":
      return evaluateGenreMood(node, input, options);
    case "taxonomy":
      return evaluateTaxonomy(node, input, options);
    case "relationship-type":
      return evaluateRelationshipType(node, input);
    case "language-usage":
      return evaluateLanguageUsage(node, input);
    case "property":
      return evaluateProperty(node, input);
    default: {
      const exhaustive: never = node;
      return exhaustive;
    }
  }
}
