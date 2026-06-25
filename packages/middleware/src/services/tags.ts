import { asc, eq, isNull, ne, sql } from "drizzle-orm";
import type { BulkDeleteResult, CreateTagInput, Tag, TagNode, UpdateTagInput } from "@eesimple/types";
import { db } from "@/db";
import { bookmarkTags, categoryRootTags, tags, type TagRow } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { InvalidRootTagError } from "@/services/categories";
import { slugify, uniqueSlug } from "@/utils/slug";

/** Thrown when a reparent would put a tag under itself or one of its descendants. */
export class TagCycleError extends Error {
  constructor() {
    super("Cannot move a tag under itself or one of its descendants");
    this.name = "TagCycleError";
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
function toTag(row: TagRow, counts?: TagBookmarkCounts): Tag {
  return {
    id: row.id,
    name: row.name,
    // Backfill runs at boot, but fall back to a derived slug so the wire type is never null.
    slug: row.slug ?? slugify(row.name),
    parentId: row.parentId,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: counts?.subtree,
    ownBookmarkCount: counts?.own,
    editableOnCard: row.editableOnCard,
  };
}

/** Build a parent→children id map from a flat tag list. Pure helper. */
function buildChildrenByParent(all: { id: string;
  parentId: string | null; }[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const tag of all) {
    if (!tag.parentId) continue;
    const siblings = map.get(tag.parentId) ?? [];
    siblings.push(tag.id);
    map.set(tag.parentId, siblings);
  }
  return map;
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
  const directSets = new Map<string, Set<string>>(all.map(tag => [tag.id, new Set<string>()]));
  for (const link of links) directSets.get(link.tagId)?.add(link.bookmarkId);

  const childrenByParent = buildChildrenByParent(all);

  const result = new Map<string, TagBookmarkCounts>();
  for (const tag of all) {
    const ownDirect = directSets.get(tag.id) ?? new Set<string>();
    const subtree = new Set<string>(ownDirect);
    const descendants = new Set<string>();
    const stack = [...(childrenByParent.get(tag.id) ?? [])];
    while (stack.length > 0) {
      const id = stack.pop()!;
      for (const bookmarkId of directSets.get(id) ?? []) {
        subtree.add(bookmarkId);
        descendants.add(bookmarkId);
      }
      for (const child of childrenByParent.get(id) ?? []) stack.push(child);
    }
    let own = 0;
    for (const bookmarkId of ownDirect) if (!descendants.has(bookmarkId)) own += 1;
    result.set(tag.id, {
      subtree: subtree.size,
      own,
    });
  }
  return result;
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
 * Resolve a tag id to the set of ids in its subtree (inclusive). Pure — operates
 * on a flat list so it can be unit-tested without a database.
 */
export function collectSubtreeIds(all: Tag[], rootId: string): Set<string> {
  const childrenByParent = buildChildrenByParent(all);
  const result = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    for (const child of childrenByParent.get(id) ?? []) stack.push(child);
  }
  return result;
}

/**
 * Whether reparenting `id` under `newParentId` would create a cycle (the new
 * parent is the tag itself or one of its descendants). Pure helper.
 */
export function wouldCreateCycle(all: Tag[], id: string, newParentId: string): boolean {
  return collectSubtreeIds(all, id).has(newParentId);
}

export async function listTags(): Promise<Tag[]> {
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      parentId: tags.parentId,
      createdAt: tags.createdAt,
      editableOnCard: tags.editableOnCard,
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
  return rows.map(row => toTag(row, counts.get(row.id)));
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
  const slug = uniqueSlug(input.name, await takenTagSlugs());
  const [row] = await db
    .insert(tags)
    .values({
      name: input.name,
      slug,
      parentId: input.parentId ?? null,
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

  const patch: Partial<Pick<TagRow, "name" | "slug" | "parentId" | "editableOnCard">> = {};
  if (input.name !== undefined) patch.name = input.name;
  // Keep the slug in sync when the name changes.
  if (input.name !== undefined) {
    patch.slug = uniqueSlug(input.name, await takenTagSlugs(id));
  }
  if (input.parentId !== undefined) patch.parentId = input.parentId;
  if (input.editableOnCard !== undefined) patch.editableOnCard = input.editableOnCard;

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
    const slug = uniqueSlug(tag.name, taken);
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
  if (rows.length > 0) invalidateBookmarkCache();
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
