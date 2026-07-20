/**
 * Pure helpers behind the AI Bulk Edit action page: resolve which bookmarks are targeted (individual
 * picks unioned with whole taxonomy groups, tree taxonomies matching their subtrees), build the
 * multi-bookmark prompt (shared field rules + vocabulary once, then one compact context block per
 * bookmark headed by its id), and parse the AI's `{ "bookmarks": [{ "id", … }] }` reply back into
 * per-bookmark proposals. Reuses the single-bookmark machinery from `bookmarkAiUpdate.ts` (the
 * per-object parser, the rules/vocabulary/example blocks, the current-value formatter) — the review
 * and apply halves stay in `bookmarkAiUpdateReview.ts`, run per bookmark with prefixed row keys.
 * No hooks, no I/O — everything is unit-tested directly.
 */

import type {
  AiUpdatableFieldKey,
  AiUpdateProposal,
} from "./bookmarkAiUpdate";
import type { AiUpdateCreation, AiUpdateReviewRow } from "./bookmarkAiUpdateReview";
import type { Bookmark, CustomProperty, Tag } from "@eesimple/types";

import {
  buildAiUpdateExample,
  buildAiUpdateRulesBlock,
  buildAiUpdateVocabularyBlock,
  DEFAULT_BOOKMARK_AI_UPDATE_TEMPLATE,
  parseBookmarkAiUpdateObject,
  propertyCurrentDisplay,
  resolveCheckedProperties,
  stripCodeFence,
} from "./bookmarkAiUpdate";
import { subtreeIds } from "./tagTree";

// ---------------------------------------------------------------------------------------------------
// Target selection
// ---------------------------------------------------------------------------------------------------

/** The bulk-edit target selection: individual bookmark ids plus whole-taxonomy-group ids. */
export interface AiBulkEditSelection {
  bookmarkIds: string[];
  categoryIds: string[];
  /** Selected tags match their whole subtree (a parent tag targets its sub-tags' bookmarks too). */
  tagIds: string[];
  /** Selected media types match their whole subtree. */
  mediaTypeIds: string[];
  websiteIds: string[];
  youtubeChannelIds: string[];
  personIds: string[];
  groupIds: string[];
  /** Selected genres/moods match their whole subtree. */
  genreMoodIds: string[];
}

export const EMPTY_AI_BULK_EDIT_SELECTION: AiBulkEditSelection = {
  bookmarkIds: [],
  categoryIds: [],
  tagIds: [],
  mediaTypeIds: [],
  websiteIds: [],
  youtubeChannelIds: [],
  personIds: [],
  groupIds: [],
  genreMoodIds: [],
};

/** Above this many targeted bookmarks the page shows a non-blocking size warning (UI-only). */
export const AI_BULK_EDIT_SOFT_WARNING_THRESHOLD = 25;

/** A minimal parent/children tree node, satisfied by TagNode / MediaTypeNode / GenreMoodNode. */
interface SubtreeNode {
  id: string;
  children: SubtreeNode[];
}

/** The trees used to expand tree-taxonomy selections to their subtrees (absent = exact-id match). */
export interface AiBulkEditTrees {
  tagTree?: SubtreeNode[];
  mediaTypeTree?: SubtreeNode[];
  genreMoodTree?: SubtreeNode[];
}

/**
 * Expand selected tree-taxonomy ids to include every descendant. A missing tree (still loading)
 * falls back to the exact ids; a selected id absent from the tree (stale) is kept as-is.
 */
function expandTreeSelection(selected: string[], tree: SubtreeNode[] | undefined): Set<string> {
  const result = new Set(selected);
  if (!tree || selected.length === 0) return result;
  const want = new Set(selected);
  const visit = (node: SubtreeNode): void => {
    if (want.has(node.id)) {
      for (const id of subtreeIds(node)) result.add(id);
    }
    node.children.forEach(visit);
  };
  tree.forEach(visit);
  return result;
}

/**
 * The targeted bookmarks: individually selected OR matching ANY selected group (union), deduped for
 * free by the single pass, in the input list's stable order. Empty selections match nothing.
 */
export function resolveBulkTargets(
  bookmarks: Bookmark[],
  selection: AiBulkEditSelection,
  trees: AiBulkEditTrees = {},
): Bookmark[] {
  const individual = new Set(selection.bookmarkIds);
  const categoryIds = new Set(selection.categoryIds);
  const tagIds = expandTreeSelection(selection.tagIds, trees.tagTree);
  const mediaTypeIds = expandTreeSelection(selection.mediaTypeIds, trees.mediaTypeTree);
  const genreMoodIds = expandTreeSelection(selection.genreMoodIds, trees.genreMoodTree);
  const websiteIds = new Set(selection.websiteIds);
  const youtubeChannelIds = new Set(selection.youtubeChannelIds);
  const personIds = new Set(selection.personIds);
  const groupIds = new Set(selection.groupIds);
  return bookmarks.filter(bookmark =>
    individual.has(bookmark.id)
    || categoryIds.has(bookmark.categoryId)
    || bookmark.tags.some(tag => tagIds.has(tag.id))
    || (bookmark.mediaType !== null && mediaTypeIds.has(bookmark.mediaType.id))
    || (bookmark.website !== null && websiteIds.has(bookmark.website.id))
    || (bookmark.youtubeChannel !== null && youtubeChannelIds.has(bookmark.youtubeChannel.id))
    || bookmark.people.some(person => personIds.has(person.id))
    || bookmark.groups.some(group => groupIds.has(group.id))
    || bookmark.genreMoods.some(genreMood => genreMoodIds.has(genreMood.id)));
}

// ---------------------------------------------------------------------------------------------------
// Prompt building
// ---------------------------------------------------------------------------------------------------

/** Options for {@link resolveAiBulkEditTagVocabulary}. */
export interface AiBulkEditTagVocabularyOptions {
  /** Tag ids the user never wants suggested — dropped from the vocabulary regardless of leaf status. */
  excludedTagIds: string[];
  /** When true, drop parent tags (any tag that is another tag's `parentId`) so only leaf tags remain. */
  preferLeafTags: boolean;
}

/**
 * The tag names offered to the AI in the prompt vocabulary: drop user-excluded tags, and — when
 * `preferLeafTags` is on — drop any tag that is a parent of another tag, leaving only leaf (most-
 * specific) tags. Parenthood is derived from the flat `Tag[]` (`parentId`), so no tag tree is needed
 * and it stays correct while the tree query is still loading. Names keep the input list's order.
 */
export function resolveAiBulkEditTagVocabulary(
  tags: Tag[],
  options: AiBulkEditTagVocabularyOptions,
): string[] {
  const excluded = new Set(options.excludedTagIds);
  const parentIds = options.preferLeafTags
    ? new Set(tags.map(tag => tag.parentId).filter((id): id is string => id !== null))
    : new Set<string>();
  return tags
    .filter(tag => !excluded.has(tag.id) && !parentIds.has(tag.id))
    .map(tag => tag.name);
}

export interface AiBulkEditPromptArgs {
  /** The stored user template; empty falls back to the single-feature default template. */
  template: string;
  /** The targeted bookmarks, in selection order. */
  bookmarks: Bookmark[];
  checked: AiUpdatableFieldKey[];
  /** Every custom property (checked ones are resolved by id from here). */
  properties: CustomProperty[];
  /** Category id → name, to render each bookmark's current category in its context block. */
  categories: { id: string;
    name: string; }[];
  /** Vocabulary lists, embedded once when the matching relation field is checked. */
  categoryNames: string[];
  mediaTypeNames: string[];
  tagNames: string[];
  /** When true, append a note asking the AI to prefer the most specific (leaf) tag. */
  preferLeafTags: boolean;
  /** Names of tags the user excluded, listed in a "do NOT use" note (empty = no note). */
  excludedTagNames: string[];
}

/**
 * The tag-guidance note appended after the vocabulary block when the `tags` field is checked: a
 * leaf-preference reminder (when on) plus an explicit "do NOT use" list of excluded tags. Null when
 * neither applies, so the block is filtered out of the prompt.
 */
function buildTagGuidanceNote(args: AiBulkEditPromptArgs): string | null {
  if (!args.checked.includes("tags")) return null;
  const lines: string[] = [];
  if (args.preferLeafTags) {
    lines.push("When choosing tags, prefer the most specific (leaf) tag; do NOT use a broad parent "
      + "tag when one of its sub-tags fits.");
  }
  if (args.excludedTagNames.length > 0) {
    lines.push(`Do NOT use these tags: ${args.excludedTagNames.join(", ")}.`);
  }
  return lines.length > 0 ? lines.join("\n") : null;
}

/** `label: value` context line, omitted (null) when the value is empty. */
function contextLine(label: string, value: string | null | undefined): string | null {
  return value != null && value !== "" ? `- ${label}: ${value}` : null;
}

/**
 * One compact context block for one bookmark, headed by its bracketed id. URL and description always
 * ride along (cheap, high-signal); other standard fields appear only when checked; checked custom
 * properties show their current value.
 */
function buildBookmarkBlock(
  bookmark: Bookmark,
  checked: ReadonlySet<AiUpdatableFieldKey>,
  checkedProperties: CustomProperty[],
  categoryNameById: Map<string, string>,
): string {
  const names = bookmark.names
    .map(name => `[${name.language.name}] ${name.value}`)
    .join("; ");
  const lines = [
    contextLine("URL", bookmark.url),
    contextLine("Description", bookmark.description),
    checked.has("category") ? contextLine("Category", categoryNameById.get(bookmark.categoryId)) : null,
    checked.has("mediaType") ? contextLine("Media type", bookmark.mediaType?.name) : null,
    checked.has("tags") ? contextLine("Tags", bookmark.tags.map(tag => tag.name).join(", ")) : null,
    checked.has("people") ? contextLine("People", bookmark.people.map(person => person.name).join(", ")) : null,
    checked.has("groups") ? contextLine("Groups", bookmark.groups.map(group => group.name).join(", ")) : null,
    checked.has("names") ? contextLine("Names", names) : null,
    checked.has("year") ? contextLine("Year", bookmark.year != null ? String(bookmark.year) : null) : null,
    checked.has("isbn") ? contextLine("ISBN", bookmark.isbn) : null,
    checked.has("priority") ? contextLine("Priority", String(bookmark.priority)) : null,
    ...checkedProperties.map(property =>
      contextLine(property.name, propertyCurrentDisplay(property, bookmark))),
  ].filter((line): line is string => line !== null);
  return [`[${bookmark.id}] ${bookmark.title}`, ...lines].join("\n");
}

/**
 * Assemble the ready-to-paste bulk prompt: template + the multi-bookmark instruction → per-field
 * output rules ONCE → existing vocabulary ONCE → one context block per bookmark → the strict-JSON
 * output instruction wrapping the shared example in `{ "bookmarks": [{ "id", … }] }`. Deliberately
 * not translated (the AI-autotag precedent).
 */
export function buildAiBulkEditPrompt(args: AiBulkEditPromptArgs): string {
  const template = args.template.trim() || DEFAULT_BOOKMARK_AI_UPDATE_TEMPLATE;
  const multi = "You are updating MULTIPLE bookmarks at once. Each bookmark below is identified by "
    + "the id in square brackets; echo that id back EXACTLY in your reply, and include an entry only "
    + "for bookmarks you can improve.";
  const checkedProperties = resolveCheckedProperties(args.checked, args.properties);
  const checkedSet = new Set(args.checked);
  const categoryNameById = new Map(args.categories.map(category => [category.id, category.name]));
  const blocks = args.bookmarks.map(bookmark =>
    buildBookmarkBlock(bookmark, checkedSet, checkedProperties, categoryNameById));
  const example = {
    bookmarks: [{
      id: args.bookmarks[0]?.id ?? "<id>",
      ...buildAiUpdateExample(args.checked, checkedProperties),
    }],
  };
  const output = "Respond with ONLY a JSON object — no prose and no code fences. Include ONLY the "
    + "fields listed above, one entry per bookmark, using exactly this shape:\n"
    + JSON.stringify(example, null, 2);
  return [
    `${template}\n\n${multi}`,
    buildAiUpdateRulesBlock(args.checked, checkedProperties),
    buildAiUpdateVocabularyBlock(args),
    buildTagGuidanceNote(args),
    ["Bookmarks:", ...blocks].join("\n\n"),
    output,
  ].filter((block): block is string => block !== null).join("\n\n");
}

// ---------------------------------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------------------------------

/** One bookmark's parsed slice of the bulk reply. */
export interface AiBulkEditParsedItem {
  bookmarkId: string;
  proposals: AiUpdateProposal[];
  ignoredKeys: string[];
}

/** The outcome of parsing the pasted bulk reply, driving the review UI. */
export type AiBulkEditParseState
  = | { kind: "empty" }
    | { kind: "error" }
    | { kind: "invalid" }
    | { kind: "ok";
      items: AiBulkEditParsedItem[];
      /** Reply ids that match no targeted bookmark (or repeat one) — surfaced, never applied. */
      unknownIds: string[]; };

/** The reply's bookmark-entry list: a `{ bookmarks: [...] }` wrapper, a bare array, or one object. */
function unwrapBulkEntries(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed !== "object" || parsed === null) return null;
  const root = parsed as Record<string, unknown>;
  if (Array.isArray(root.bookmarks)) return root.bookmarks;
  // A single per-bookmark object (id + fields) — a common AI drift when only one bookmark changed.
  if (typeof root.id === "string") return [root];
  return null;
}

/**
 * Parse the pasted bulk reply against the checked fields. Mirrors the single-bookmark parse states;
 * each entry's fields go through the shared per-object parser. An entry whose id matches no targeted
 * bookmark — or repeats an id already seen — lands in `unknownIds` instead of failing the parse.
 */
export function parseAiBulkEditText(
  text: string,
  checked: AiUpdatableFieldKey[],
  properties: CustomProperty[],
  knownIds: ReadonlySet<string>,
): AiBulkEditParseState {
  const trimmed = text.trim();
  if (!trimmed) return {
    kind: "empty",
  };
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(trimmed));
  }
  catch {
    return {
      kind: "error",
    };
  }
  const entries = unwrapBulkEntries(parsed);
  if (!entries) return {
    kind: "invalid",
  };
  const items: AiBulkEditParsedItem[] = [];
  const unknownIds: string[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) continue;
    const {
      id, ...fields
    } = entry as Record<string, unknown>;
    const bookmarkId = typeof id === "string" ? id.trim() : "";
    if (!bookmarkId || !knownIds.has(bookmarkId) || seen.has(bookmarkId)) {
      unknownIds.push(bookmarkId || "(missing id)");
      continue;
    }
    seen.add(bookmarkId);
    items.push({
      bookmarkId,
      ...parseBookmarkAiUpdateObject(fields, checked, properties),
    });
  }
  return {
    kind: "ok",
    items,
    unknownIds,
  };
}

// ---------------------------------------------------------------------------------------------------
// Review/apply glue
// ---------------------------------------------------------------------------------------------------

/**
 * Prefix each review row's key with its bookmark id so keys stay globally unique across the page's
 * per-bookmark review sections (one shared excluded-set). The prefixed keys flow through
 * `buildAiUpdateApplyPlan` unchanged — `creation.rowKey` and `createdIds` lookups use the same key.
 */
export function prefixReviewRows(bookmarkId: string, rows: AiUpdateReviewRow[]): AiUpdateReviewRow[] {
  return rows.map(row => ({
    ...row,
    key: `${bookmarkId}:${row.key}`,
  }));
}

/** One entity creation shared by every bookmark that proposed the same (kind, name). */
export interface AiBulkEditCreationGroup {
  kind: AiUpdateCreation["kind"];
  /** The first-seen spelling of the name (matching is case-insensitive). */
  name: string;
  /** Every review-row key that needs the created id fanned out to it. */
  rowKeys: string[];
}

/**
 * Group the per-bookmark plans' creations by (kind, case-insensitive name) so a tag proposed for
 * three bookmarks is created ONCE, its id fanned out to every contributing row key.
 */
export function dedupeBulkCreations(creations: AiUpdateCreation[]): AiBulkEditCreationGroup[] {
  const groups = new Map<string, AiBulkEditCreationGroup>();
  for (const creation of creations) {
    const key = `${creation.kind}:${creation.name.trim().toLowerCase()}`;
    const group = groups.get(key);
    if (group) group.rowKeys.push(creation.rowKey);
    else groups.set(key, {
      kind: creation.kind,
      name: creation.name,
      rowKeys: [creation.rowKey],
    });
  }
  return [...groups.values()];
}

/** Human-readable summary of a bulk apply for the success toast (the describeReparentResult shape). */
export function describeAiBulkEditResult(
  fieldCount: number,
  bookmarkCount: number,
  createdCount: number,
): string {
  const parts = [
    `Updated ${fieldCount} field${fieldCount === 1 ? "" : "s"} across ${bookmarkCount} bookmark${bookmarkCount === 1 ? "" : "s"}`,
  ];
  if (createdCount > 0) {
    parts.push(`created ${createdCount} new ${createdCount === 1 ? "entry" : "entries"}`);
  }
  return parts.join(", ");
}
