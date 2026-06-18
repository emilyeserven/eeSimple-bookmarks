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
 * Leaf: the bookmark carries one of `tagIds`. Cascade (a selected parent also matches its
 * descendants) is applied at EVALUATION time, so `tagIds` stores exactly what the user picked.
 */
export interface TagCondition {
  type: "tag";
  tagIds: string[];
}

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
          predicate: DateTimePredicate; };
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
    | TagCondition
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
  /** The bookmark's resolved category id. */
  categoryId: string;
  /** The bookmark's own tag ids (NOT expanded for cascade). */
  tagIds: Set<string>;
  /** Number/calculate custom-property values, keyed by property id. */
  numberValues: Map<string, number>;
  /** Boolean custom-property values, keyed by property id. */
  booleanValues: Map<string, boolean>;
  /** Date/time custom-property values (canonical string encoding), keyed by property id. */
  dateTimeValues: Map<string, string>;
}

/** Resolves a tag id to the inclusive set of its descendant ids (for cascade matching). */
export type TagDescendants = (tagId: string) => Set<string>;

/** Optional dependencies for evaluation. */
export interface EvaluateOptions {
  /** Tag cascade resolver; when omitted, a tag leaf matches only the exact ids selected. */
  tagDescendants?: TagDescendants;
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

/** Extract a URL's host with a leading `www.` removed, or `null` if it can't be parsed. */
function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  }
  catch {
    return null;
  }
}

function evaluateMatch(condition: MatchCondition, input: ConditionInput): boolean {
  const pattern = condition.pattern.trim();
  if (pattern === "") return false;

  // The `domain` operator always inspects the URL's host regardless of `field`.
  if (condition.operator === "domain") {
    const host = hostOf(input.url);
    return host !== null && host === pattern.replace(/^www\./i, "").toLowerCase();
  }

  const haystack = condition.field === "url" ? input.url : input.title;
  if (haystack === "") return false;

  switch (condition.operator) {
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

function evaluateTag(
  condition: TagCondition,
  input: ConditionInput,
  options: EvaluateOptions | undefined,
): boolean {
  if (condition.tagIds.length === 0) return false;
  const resolve = options?.tagDescendants;
  for (const tagId of condition.tagIds) {
    const candidates = resolve ? resolve(tagId) : new Set([tagId]);
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
    case "tag":
      return evaluateTag(node, input, options);
    case "property":
      return evaluateProperty(node, input);
    default: {
      const exhaustive: never = node;
      return exhaustive;
    }
  }
}
