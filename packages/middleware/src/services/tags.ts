import { and, asc, eq, ne, sql } from "drizzle-orm";
import type { BulkBookmarkResult, BulkDeleteResult, CreateTagInput, EntityName, SectionEntry, Tag, TagNode, TagReparentPlanInput, TagReparentResult, TitleTagCandidate, UpdateTagInput } from "@eesimple/types";
import { collectSectionTagIds, matchTagIdsByTitle, reassignSectionTagIds, removeSectionTagIds, titleMatchesTerm } from "@eesimple/types";
import { db } from "@/db";
import { bookmarkSectionsValues, bookmarkTags, tags, type TagRow } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { bulkApplyEntities, bulkDeleteEntities } from "@/services/bulkDelete";
import { deleteTaxonomyAssignmentsForOwner } from "@/services/taxonomyAssignments";
import { deleteEntityNamesForOwner, loadEntityNames } from "@/services/entityNames";
import {
  collectSubtreeIds as collectParentTreeSubtreeIds,
  computeSubtreeBookmarkCounts,
} from "@/utils/parentTree";
import { AppError } from "@/utils/errors";
import { slugify, uniqueSlug } from "@/utils/slug";

/** Thrown when a reparent would put a tag under itself or one of its descendants. */
export class TagCycleError extends AppError {
  constructor() {
    super("Cannot move a tag under itself or one of its descendants", "cycle", 400);
  }
}

/** Thrown when a delete's `reassignTo` target is missing or is the tag (or a descendant) being deleted. */
export class InvalidTagReassignError extends AppError {
  constructor(message = "Invalid reassignment target") {
    super(message, "invalidReassignTarget", 400);
  }
}

/** Distinct-bookmark counts for a tag: across its whole subtree, and for the tag alone. */
export interface TagBookmarkCounts {
  /** Distinct bookmarks carrying this tag or any descendant. */
  subtree: number;
  /** Distinct bookmarks carrying this tag but none of its descendants (the "No Child" bucket). */
  own: number;
  /** Distinct bookmarks with a sections-property entry/child tagged with this tag or a descendant. */
  section?: number;
}

/** Map a DB row (plus optional precomputed counts) to the shared `Tag` wire type. */
function toTag(row: TagRow, counts?: TagBookmarkCounts, names?: EntityName[]): Tag {
  return {
    id: row.id,
    name: row.name,
    names: names ?? [],
    // Backfill runs at boot, but fall back to a derived slug so the wire type is never null.
    slug: row.slug ?? slugify(row.name),
    parentId: row.parentId,
    description: row.description,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: counts?.subtree,
    ownBookmarkCount: counts?.own,
    sectionBookmarkCount: counts?.section,
    editableOnCard: row.editableOnCard,
    excludeFromBackfill: row.excludeFromBackfill,
    isFavorite: row.isFavorite,
  };
}

// The "auto-tag from title" matcher lives in `@eesimple/types` so the middleware (create / backfill)
// and the client (Inbox prefill preview) share one implementation. Re-exported here so existing
// callers and tests keep importing from `@/services/tags`.
export { matchTagIdsByTitle, titleMatchesTerm };

/**
 * Lightweight id/name listing of every tag, used by the title-matching automation. Each tag also
 * carries its language-labelled `names` values so the matcher matches a bookmark title written in
 * any script against a tag named in another.
 */
export async function listTagNames(): Promise<TitleTagCandidate[]> {
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
    })
    .from(tags);
  const namesById = await loadEntityNames("tag", rows.map(row => row.id));
  return rows.map(row => ({
    ...row,
    names: namesById.get(row.id) ?? [],
  }));
}

/**
 * Ids of every tag currently flagged `exclude_from_backfill = true`. Such tags are kept out of every
 * backfill automation (autofill-rule backfill *and* the title-tag backfill), so a common/generic tag
 * a user has opted out of never gets applied retroactively. Shared by both backfill services so the
 * exclusion stays consistent.
 */
export async function getExcludedFromBackfillTagIds(): Promise<Set<string>> {
  const rows = await db
    .select({
      id: tags.id,
      excludeFromBackfill: tags.excludeFromBackfill,
    })
    .from(tags);
  return new Set(rows.filter(row => row.excludeFromBackfill).map(row => row.id));
}

/** Compact `{id, name}` listing of every tag, for client-side match-or-create flows. */
export async function listTagsCompact(): Promise<{ id: string;
  name: string; }[]> {
  return db
    .select({
      id: tags.id,
      name: tags.name,
    })
    .from(tags);
}

/**
 * Compute each tag's distinct subtree bookmark count and its "own" (no-descendant) count from a
 * flat tag list and the bookmark↔tag links. Distinct counting dedupes bookmarks tagged with both a
 * tag and one of its descendants. Pure — operates on in-memory data so it can be unit-tested.
 */
export function computeTagBookmarkCounts(
  all: { id: string;
    parentId: string | null; }[],
  links: { tagId: string;
    bookmarkId: string; }[],
): Map<string, TagBookmarkCounts> {
  return computeSubtreeBookmarkCounts(all, links.map(link => ({
    nodeId: link.tagId,
    bookmarkId: link.bookmarkId,
  })));
}

/**
 * Compute each tag's distinct count of bookmarks whose sections-property entries (either tier)
 * reference the tag or one of its descendants. Section tags live only inside the
 * `bookmark_sections_values` jsonb (no join table), so the links are derived by walking each row
 * with the shared `collectSectionTagIds`; dangling ids drop out because
 * `computeSubtreeBookmarkCounts` only seeds sets for ids present in `all`. Pure — unit-testable.
 */
export function computeTagSectionBookmarkCounts(
  all: { id: string;
    parentId: string | null; }[],
  rows: { bookmarkId: string;
    sections: SectionEntry[]; }[],
): Map<string, number> {
  const links = rows.flatMap(row => collectSectionTagIds(row.sections).map(tagId => ({
    nodeId: tagId,
    bookmarkId: row.bookmarkId,
  })));
  const counts = computeSubtreeBookmarkCounts(all, links);
  return new Map([...counts].map(([id, count]) => [id, count.subtree]));
}

/** Existing tag slugs, optionally excluding one tag id (when renaming). */
async function takenTagSlugs(excludeId?: string): Promise<string[]> {
  const rows = await db
    .select({
      slug: tags.slug,
    })
    .from(tags)
    .where(excludeId ? ne(tags.id, excludeId) : undefined);
  return rows.map(row => row.slug).filter((slug): slug is string => slug !== null);
}

/**
 * Build a nested tree from a flat tag list (roots first). Pure — kept separate
 * from DB access so it can be unit-tested with in-memory data.
 */
export function buildTagTree(all: Tag[]): TagNode[] {
  const byId = new Map<string, TagNode>(all.map(tag => [tag.id, {
    ...tag,
    children: [],
  }]));
  const roots: TagNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/**
 * Whether reparenting `id` under `newParentId` would create a cycle (the new
 * parent is the tag itself or one of its descendants). Pure helper.
 */
export function wouldCreateCycle(all: Tag[], id: string, newParentId: string): boolean {
  return collectParentTreeSubtreeIds(all, id).has(newParentId);
}

export async function listTags(): Promise<Tag[]> {
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      parentId: tags.parentId,
      description: tags.description,
      createdAt: tags.createdAt,
      editableOnCard: tags.editableOnCard,
      excludeFromBackfill: tags.excludeFromBackfill,
      isFavorite: tags.isFavorite,
    })
    .from(tags)
    .orderBy(asc(tags.name));
  const links = await db
    .select({
      tagId: bookmarkTags.tagId,
      bookmarkId: bookmarkTags.bookmarkId,
    })
    .from(bookmarkTags);
  const counts = computeTagBookmarkCounts(rows, links);
  const sectionRows = await db
    .select({
      bookmarkId: bookmarkSectionsValues.bookmarkId,
      sections: bookmarkSectionsValues.sections,
    })
    .from(bookmarkSectionsValues);
  const sectionCounts = computeTagSectionBookmarkCounts(
    rows,
    sectionRows.map(row => ({
      bookmarkId: row.bookmarkId,
      sections: row.sections as SectionEntry[],
    })),
  );
  const namesMap = await loadEntityNames("tag", rows.map(row => row.id));
  return rows.map(row => toTag(row, {
    ...counts.get(row.id) ?? {
      subtree: 0,
      own: 0,
    },
    section: sectionCounts.get(row.id),
  }, namesMap.get(row.id)));
}

export async function getTagTree(): Promise<TagNode[]> {
  return buildTagTree(await listTags());
}

/**
 * Resolve a tag id to the set of ids in its subtree (inclusive) via a recursive
 * CTE. The `.rows` access is the one spot coupled to node-postgres' result shape.
 */
export async function getDescendantIds(rootId: string): Promise<Set<string>> {
  // node-postgres' `execute` resolves to a `pg.QueryResult` whose `.rows` holds
  // the data; the cast pins that shape and keeps the coupling in one place.
  const result = (await db.execute<{ id: string }>(sql`
    WITH RECURSIVE subtree AS (
      SELECT ${tags.id} FROM ${tags} WHERE ${tags.id} = ${rootId}
      UNION ALL
      SELECT t.id FROM ${tags} t
      INNER JOIN subtree s ON t.parent_id = s.id
    )
    SELECT id FROM subtree
  `)) as unknown as { rows: { id: string }[] };
  return new Set(result.rows.map(row => row.id));
}

export async function createTag(input: CreateTagInput): Promise<Tag> {
  const slug = uniqueSlug(input.name, await takenTagSlugs(), "tag");
  const [row] = await db
    .insert(tags)
    .values({
      name: input.name,
      slug,
      parentId: input.parentId ?? null,
      description: input.description ?? null,
    })
    .returning();
  // The tag tree feeds the cached tag-descendant resolver used by condition matching.
  invalidateBookmarkCache();
  return toTag(row);
}

/**
 * Resolve tag names to tag ids, creating any that don't yet exist (case-insensitive match). The
 * `created` counter is incremented per newly-created tag. Shared by the AI Summarization and AI
 * Autotag apply flows, which both union AI-suggested tag names onto bookmarks.
 */
export async function resolveTagIdsByName(
  names: string[],
  created: { count: number },
): Promise<string[]> {
  const cleaned = [...new Set(names.map(name => name.trim()).filter(Boolean))];
  if (cleaned.length === 0) return [];

  const existing = await db
    .select({
      id: tags.id,
      name: tags.name,
    })
    .from(tags);
  const idByLowerName = new Map(existing.map(tag => [tag.name.toLowerCase(), tag.id]));

  const ids: string[] = [];
  for (const name of cleaned) {
    const hit = idByLowerName.get(name.toLowerCase());
    if (hit) {
      ids.push(hit);
      continue;
    }
    const tag = await createTag({
      name,
    });
    idByLowerName.set(name.toLowerCase(), tag.id);
    created.count += 1;
    ids.push(tag.id);
  }
  return ids;
}

export async function updateTag(id: string, input: UpdateTagInput): Promise<Tag | null> {
  if (input.parentId !== undefined && input.parentId !== null) {
    if (input.parentId === id) throw new TagCycleError();
    const all = await listTags();
    if (wouldCreateCycle(all, id, input.parentId)) throw new TagCycleError();
  }

  const patch: Partial<Pick<TagRow, "name" | "slug" | "parentId" | "description" | "editableOnCard" | "excludeFromBackfill" | "isFavorite">> = {};
  if (input.name !== undefined) patch.name = input.name;
  // Keep the slug in sync when the name changes.
  if (input.name !== undefined) {
    patch.slug = uniqueSlug(input.name, await takenTagSlugs(id), "tag");
  }
  if (input.parentId !== undefined) patch.parentId = input.parentId;
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.editableOnCard !== undefined) patch.editableOnCard = input.editableOnCard;
  if (input.excludeFromBackfill !== undefined) patch.excludeFromBackfill = input.excludeFromBackfill;
  if (input.isFavorite !== undefined) patch.isFavorite = input.isFavorite;

  const [row] = await db.update(tags).set(patch).where(eq(tags.id, id)).returning();
  // A reparent changes tag-descendant resolution; invalidate the condition-matching cache.
  if (row) invalidateBookmarkCache();
  return row ? toTag(row) : null;
}

/**
 * Move every bookmark tagged with any tag in `subtree` onto `reassignToId`, deduping. Deleting a tag
 * cascades away its own and its descendants' `bookmark_tags` links, so we reassign the whole subtree
 * (the tag being deleted plus its descendants) up front: gather the affected bookmarks, drop the
 * subtree link rows explicitly, then insert one target link per affected bookmark that doesn't already
 * carry it (the `(bookmarkId, tagId)` PK forbids a duplicate).
 */
async function reassignSubtreeBookmarkTags(subtree: Set<string>, reassignToId: string): Promise<void> {
  const alreadyTargetRows = await db
    .select({
      bookmarkId: bookmarkTags.bookmarkId,
    })
    .from(bookmarkTags)
    .where(eq(bookmarkTags.tagId, reassignToId));
  const alreadyTarget = new Set(alreadyTargetRows.map(row => row.bookmarkId));

  const affected = new Set<string>();
  for (const tagId of subtree) {
    const rows = await db
      .select({
        bookmarkId: bookmarkTags.bookmarkId,
      })
      .from(bookmarkTags)
      .where(eq(bookmarkTags.tagId, tagId));
    for (const row of rows) affected.add(row.bookmarkId);
    await db.delete(bookmarkTags).where(eq(bookmarkTags.tagId, tagId));
  }

  const toInsert = [...affected]
    .filter(bookmarkId => !alreadyTarget.has(bookmarkId))
    .map(bookmarkId => ({
      bookmarkId,
      tagId: reassignToId,
    }));
  if (toInsert.length > 0) await db.insert(bookmarkTags).values(toInsert);
}

/**
 * Rewrite every `bookmark_sections_values.sections` jsonb that references a tag in `subtree`, pointing
 * those `SectionEntry.tagIds` at `reassignToId` instead (the write counterpart to the dangling-id read
 * behavior). No FK backs the jsonb, so this must run explicitly — only rows that actually change are
 * updated.
 */
async function reassignSubtreeSectionTags(subtree: Set<string>, reassignToId: string): Promise<void> {
  const rows = await db.select().from(bookmarkSectionsValues);
  for (const row of rows) {
    const sections = (row.sections ?? []) as SectionEntry[];
    if (!collectSectionTagIds(sections).some(tagId => subtree.has(tagId))) continue;
    const next = reassignSectionTagIds(sections, subtree, reassignToId);
    if (next === sections) continue;
    await db
      .update(bookmarkSectionsValues)
      .set({
        sections: next,
      })
      .where(and(
        eq(bookmarkSectionsValues.bookmarkId, row.bookmarkId),
        eq(bookmarkSectionsValues.propertyId, row.propertyId),
      ));
  }
}

/**
 * Reassign the deleted tag's (and its descendants') bookmark + section references to `reassignToId`
 * before the delete cascade removes them. Throws {@link InvalidTagReassignError} when the target is the
 * tag itself, a descendant (about to be cascade-deleted), or missing.
 */
async function reassignTagReferences(rootId: string, reassignToId: string): Promise<void> {
  if (reassignToId === rootId) throw new InvalidTagReassignError();
  const allTags = await db
    .select({
      id: tags.id,
      parentId: tags.parentId,
    })
    .from(tags);
  const subtree = collectParentTreeSubtreeIds(allTags, rootId);
  if (subtree.has(reassignToId)) throw new InvalidTagReassignError();
  if (!allTags.some(tag => tag.id === reassignToId)) {
    throw new InvalidTagReassignError("Reassignment target not found");
  }

  await reassignSubtreeBookmarkTags(subtree, reassignToId);
  await reassignSubtreeSectionTags(subtree, reassignToId);
}

/**
 * Delete a tag. Returns false when not found. FK cascade removes descendant tags and any
 * `bookmark_tags` links. When `reassignToId` is given, the deleted tag's (and its descendants')
 * bookmark memberships and section tag references are moved onto the target first, instead of being
 * cascade-dropped / left dangling.
 */
export async function deleteTag(id: string, reassignToId?: string): Promise<boolean> {
  const [existing] = await db.select().from(tags).where(eq(tags.id, id));
  if (!existing) return false;

  if (reassignToId !== undefined) await reassignTagReferences(id, reassignToId);

  await db.delete(tags).where(eq(tags.id, id));
  // Cascade removes descendant tags and bookmark_tags links — both feed condition matching.
  // Genre/mood assignments key off (ownerType, ownerId) with no FK on ownerId, so clean them up here.
  await deleteTaxonomyAssignmentsForOwner("tag", id);
  await deleteEntityNamesForOwner("tag", id);
  invalidateBookmarkCache();
  return true;
}

/**
 * Rewrite every `bookmark_sections_values.sections` jsonb that references a tag in `tagIds`, dropping
 * those `SectionEntry.tagIds` members (the removal counterpart to {@link reassignSubtreeSectionTags}).
 * No FK backs the jsonb, so this must run explicitly — only rows that actually change are updated.
 */
async function removeSectionTagReferences(tagIds: Set<string>): Promise<void> {
  const rows = await db.select().from(bookmarkSectionsValues);
  for (const row of rows) {
    const sections = (row.sections ?? []) as SectionEntry[];
    if (!collectSectionTagIds(sections).some(tagId => tagIds.has(tagId))) continue;
    const next = removeSectionTagIds(sections, tagIds);
    if (next === sections) continue;
    await db
      .update(bookmarkSectionsValues)
      .set({
        sections: next,
      })
      .where(and(
        eq(bookmarkSectionsValues.bookmarkId, row.bookmarkId),
        eq(bookmarkSectionsValues.propertyId, row.propertyId),
      ));
  }
}

/**
 * Remove all of a tag's own bookmark associations without deleting the tag: drop the `bookmark_tags`
 * links for this tag only (its descendants and their links are untouched) and strip its id from every
 * bookmark's Sections-property jsonb. Returns false when the tag doesn't exist. This is the escape
 * hatch for a non-leaf tag, which can't be delete-and-recreated to clear its links without cascading
 * away its child subtree.
 */
export async function removeTagBookmarkAssociations(id: string): Promise<boolean> {
  const [existing] = await db.select().from(tags).where(eq(tags.id, id));
  if (!existing) return false;

  await db.delete(bookmarkTags).where(eq(bookmarkTags.tagId, id));
  await removeSectionTagReferences(new Set([id]));
  invalidateBookmarkCache();
  return true;
}

/**
 * Delete many tags, reporting per-item outcomes. Deleting a parent cascades to its descendants, so a
 * descendant also passed in the same batch may already be gone and report `not-found`.
 */
export function bulkDeleteTags(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteTag);
}

/**
 * Move many tags under a new parent (`null` = top level), reporting per-item outcomes. Each item
 * goes through `updateTag`, so the per-item cycle guard applies: moving a tag under itself or one
 * of its own descendants reports an `error` row with the cycle message rather than failing the
 * whole batch.
 */
export function bulkReparentTags(
  ids: string[],
  parentId: string | null,
): Promise<BulkBookmarkResult[]> {
  return bulkApplyEntities(ids, id => updateTag(id, {
    parentId,
  }));
}

/**
 * Apply an AI-proposed hierarchy change: create the plan's `newTags` (grouping tags), then move each
 * of its `moves` under the resolved parent. A move's `parentId` may be an existing tag id, `null`
 * (root), or a `tempId` from `newTags` — resolved here to the freshly-created tag's id.
 *
 * Failures are per-item and non-fatal (mirrors `bulkReparentTags`): a `newTag` whose existing parent
 * is missing, or a `move` whose target/tempId doesn't resolve or would create a cycle, is recorded in
 * `notFound` rather than aborting the batch. `createTag`/`updateTag` invalidate the bookmark cache.
 */
export async function applyTagReparentPlan(input: TagReparentPlanInput): Promise<TagReparentResult> {
  const notFound: string[] = [];
  const tempIdToRealId = new Map<string, string>();
  let created = 0;
  let moved = 0;

  const existingIds = new Set((await db.select({
    id: tags.id,
  }).from(tags)).map(row => row.id));

  for (const newTag of input.newTags) {
    const name = newTag.name.trim();
    // A new grouping tag may only nest under an existing tag or the root (v1), so no tempId chasing.
    // A blank name or a parent that no longer exists is skipped rather than failing the whole plan.
    if (!name || (newTag.parentId !== null && !existingIds.has(newTag.parentId))) {
      notFound.push(newTag.tempId);
      continue;
    }
    const tag = await createTag({
      name,
      parentId: newTag.parentId,
    });
    tempIdToRealId.set(newTag.tempId, tag.id);
    existingIds.add(tag.id);
    created += 1;
  }

  for (const move of input.moves) {
    const resolvedParentId = move.parentId === null
      ? null
      : tempIdToRealId.get(move.parentId) ?? move.parentId;
    try {
      const updated = await updateTag(move.id, {
        parentId: resolvedParentId,
      });
      if (updated) moved += 1;
      else notFound.push(move.id);
    }
    catch {
      // TagCycleError or any per-item failure — skip this move, keep the batch going.
      notFound.push(move.id);
    }
  }

  return {
    created,
    moved,
    notFound,
  };
}
