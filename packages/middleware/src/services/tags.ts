import { asc, eq, isNull, ne, sql } from "drizzle-orm";
import type { BulkDeleteResult, CreateTagInput, EntityName, Tag, TagNode, TitleTagCandidate, UpdateTagInput } from "@eesimple/types";
import { matchTagIdsByTitle, titleMatchesTerm } from "@eesimple/types";
import { db } from "@/db";
import { bookmarkTags, categoryRootTags, tags, type TagRow } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { InvalidRootTagError } from "@/services/categories";
import { deleteGenreMoodAssignmentsForOwner } from "@/services/genreMoodAssignments";
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

/** Distinct-bookmark counts for a tag: across its whole subtree, and for the tag alone. */
export interface TagBookmarkCounts {
  /** Distinct bookmarks carrying this tag or any descendant. */
  subtree: number;
  /** Distinct bookmarks carrying this tag but none of its descendants (the "No Child" bucket). */
  own: number;
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
    editableOnCard: row.editableOnCard,
    excludeFromBackfill: row.excludeFromBackfill,
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
  const namesMap = await loadEntityNames("tag", rows.map(row => row.id));
  return rows.map(row => toTag(row, counts.get(row.id), namesMap.get(row.id)));
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

export async function updateTag(id: string, input: UpdateTagInput): Promise<Tag | null> {
  if (input.parentId !== undefined && input.parentId !== null) {
    if (input.parentId === id) throw new TagCycleError();
    const all = await listTags();
    if (wouldCreateCycle(all, id, input.parentId)) throw new TagCycleError();
  }

  const patch: Partial<Pick<TagRow, "name" | "slug" | "parentId" | "description" | "editableOnCard" | "excludeFromBackfill">> = {};
  if (input.name !== undefined) patch.name = input.name;
  // Keep the slug in sync when the name changes.
  if (input.name !== undefined) {
    patch.slug = uniqueSlug(input.name, await takenTagSlugs(id), "tag");
  }
  if (input.parentId !== undefined) patch.parentId = input.parentId;
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.editableOnCard !== undefined) patch.editableOnCard = input.editableOnCard;
  if (input.excludeFromBackfill !== undefined) patch.excludeFromBackfill = input.excludeFromBackfill;

  const [row] = await db.update(tags).set(patch).where(eq(tags.id, id)).returning();
  // A reparent changes tag-descendant resolution; invalidate the condition-matching cache.
  if (row) invalidateBookmarkCache();
  return row ? toTag(row) : null;
}

/** Fill in slugs for any tags missing one (e.g. rows that predate the `slug` column). */
export async function backfillTagSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: tags.id,
      name: tags.name,
    })
    .from(tags)
    .where(isNull(tags.slug));
  if (missing.length === 0) return;

  const taken = await takenTagSlugs();
  for (const tag of missing) {
    const slug = uniqueSlug(tag.name, taken, "tag");
    taken.push(slug);
    await db.update(tags).set({
      slug,
    }).where(eq(tags.id, tag.id));
  }
}

export async function deleteTag(id: string): Promise<boolean> {
  // FK cascade removes descendant tags and any bookmark_tags link rows.
  const rows = await db.delete(tags).where(eq(tags.id, id)).returning({
    id: tags.id,
  });
  // Cascade removes descendant tags and bookmark_tags links — both feed condition matching.
  if (rows.length > 0) {
    // Genre/mood assignments key off (ownerType, ownerId) with no FK on ownerId, so clean them up here.
    await deleteGenreMoodAssignmentsForOwner("tag", id);
    await deleteEntityNamesForOwner("tag", id);
    invalidateBookmarkCache();
  }
  return rows.length > 0;
}

/**
 * Delete many tags, reporting per-item outcomes. Deleting a parent cascades to its descendants, so a
 * descendant also passed in the same batch may already be gone and report `not-found`.
 */
export function bulkDeleteTags(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteTag);
}

/** The categories whose root-tag allowlist includes this tag (the reverse of the Tiered Tags tab). */
export async function getTagCategories(tagId: string): Promise<string[]> {
  const rows = await db
    .select({
      categoryId: categoryRootTags.categoryId,
    })
    .from(categoryRootTags)
    .where(eq(categoryRootTags.tagId, tagId));
  return rows.map(row => row.categoryId);
}

/**
 * Replace the set of categories whose root-tag allowlist includes this tag. Returns null if the
 * tag is missing; throws `InvalidRootTagError` if it is not a root tag (only root tags can be
 * scoped to categories, matching the Tiered Tags allowlist). Display-only — like
 * `setCategoryRootTags`, it does not touch the bookmark cache.
 */
export async function setTagCategories(
  tagId: string,
  categoryIds: string[],
): Promise<string[] | null> {
  const [tag] = await db
    .select({
      id: tags.id,
      parentId: tags.parentId,
    })
    .from(tags)
    .where(eq(tags.id, tagId));
  if (!tag) return null;
  if (tag.parentId !== null) {
    throw new InvalidRootTagError(`Tag ${tagId} is not a root tag`);
  }

  await db.transaction(async (tx) => {
    await tx.delete(categoryRootTags).where(eq(categoryRootTags.tagId, tagId));
    if (categoryIds.length > 0) {
      await tx.insert(categoryRootTags).values(categoryIds.map(categoryId => ({
        categoryId,
        tagId,
      })));
    }
  });
  return categoryIds;
}
