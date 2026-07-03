import { asc, eq, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateGenreMoodInput,
  GenreMood,
  GenreMoodNode,
  UpdateGenreMoodInput,
} from "@eesimple/types";
import { db } from "@/db";
import { genreMoodAssignments, genreMoods, type GenreMoodRow } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import {
  collectSubtreeIds,
  computeSubtreeBookmarkCounts,
  type SubtreeBookmarkCounts,
} from "@/utils/parentTree";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing entry name under the same parent. */
export class DuplicateGenreMoodError extends Error {
  constructor(name: string) {
    super(`A Genres & Moods entry named "${name}" already exists`);
    this.name = "DuplicateGenreMoodError";
  }
}

/** Thrown when a reparent would put an entry under itself or one of its descendants. */
export class GenreMoodCycleError extends Error {
  constructor() {
    super("Cannot move an entry under itself or one of its descendants");
    this.name = "GenreMoodCycleError";
  }
}

/** Map a DB row (plus optional precomputed counts) to the shared `GenreMood` wire type. */
function toGenreMood(row: GenreMoodRow, counts?: SubtreeBookmarkCounts): GenreMood {
  return {
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName,
    // Backfill runs at boot, but fall back to a derived slug so the wire type is never null.
    slug: row.slug ?? slugify(row.name),
    parentId: row.parentId,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: counts?.subtree,
    ownBookmarkCount: counts?.own,
  };
}

/**
 * Compute each entry's distinct subtree bookmark count and its "own" (no-descendant) count from a
 * flat list and the bookmark links. Distinct counting dedupes bookmarks carrying both an entry and
 * one of its descendants. Pure — operates on in-memory data so it can be unit-tested.
 */
export function computeGenreMoodBookmarkCounts(
  all: { id: string;
    parentId: string | null; }[],
  links: { genreMoodId: string;
    bookmarkId: string; }[],
): Map<string, SubtreeBookmarkCounts> {
  return computeSubtreeBookmarkCounts(all, links.map(link => ({
    nodeId: link.genreMoodId,
    bookmarkId: link.bookmarkId,
  })));
}

/**
 * Build a nested tree from a flat list (roots first). Pure — kept separate from DB access so it can
 * be unit-tested with in-memory data.
 */
export function buildGenreMoodTree(all: GenreMood[]): GenreMoodNode[] {
  const byId = new Map<string, GenreMoodNode>(all.map(node => [node.id, {
    ...node,
    children: [],
  }]));
  const roots: GenreMoodNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/**
 * Whether reparenting `id` under `newParentId` would create a cycle (the new parent is the entry
 * itself or one of its descendants). Pure helper (module-private — mirrors tags' `wouldCreateCycle`
 * but unexported to avoid a duplicate-export collision with it).
 */
function wouldCreateCycle(all: GenreMood[], id: string, newParentId: string): boolean {
  return collectSubtreeIds(all, id).has(newParentId);
}

/** Existing slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(genreMoods, genreMoods.slug, genreMoods.id, excludeId);

/** List every entry, ordered by name, with distinct bookmark counts. */
export async function listGenreMoods(): Promise<GenreMood[]> {
  const rows = await db.select().from(genreMoods).orderBy(asc(genreMoods.name));
  const links = await db
    .select({
      genreMoodId: genreMoodAssignments.genreMoodId,
      bookmarkId: genreMoodAssignments.ownerId,
    })
    .from(genreMoodAssignments)
    .where(eq(genreMoodAssignments.ownerType, "bookmark"));
  const counts = computeGenreMoodBookmarkCounts(rows, links);
  return rows.map(row => toGenreMood(row, counts.get(row.id)));
}

/** The full taxonomy as a nested tree (roots first). */
export async function getGenreMoodTree(): Promise<GenreMoodNode[]> {
  return buildGenreMoodTree(await listGenreMoods());
}

/** Fetch an entry by its slug, or `null` when absent. */
export async function getGenreMoodBySlug(slug: string): Promise<GenreMood | null> {
  const [row] = await db.select().from(genreMoods).where(eq(genreMoods.slug, slug));
  return row ? toGenreMood(row) : null;
}

/** Add an entry. Throws `DuplicateGenreMoodError` on a sibling name clash. */
export async function createGenreMood(input: CreateGenreMoodInput): Promise<GenreMood> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateGenreMoodError(input.name);

  const slug = uniqueSlug(name, await takenSlugs());
  const [row] = await db
    .insert(genreMoods)
    .values({
      name,
      romanizedName: input.romanizedName ?? null,
      slug,
      parentId: input.parentId ?? null,
    })
    .returning();
  return toGenreMood(row);
}

/** Rename and/or reparent an entry. */
export async function updateGenreMood(
  id: string,
  input: UpdateGenreMoodInput,
): Promise<GenreMood | null> {
  if (input.parentId !== undefined && input.parentId !== null) {
    if (input.parentId === id) throw new GenreMoodCycleError();
    const all = await listGenreMoods();
    if (wouldCreateCycle(all, id, input.parentId)) throw new GenreMoodCycleError();
  }

  const patch: Partial<Pick<GenreMoodRow, "name" | "romanizedName" | "slug" | "parentId">> = {};
  if (input.name !== undefined) {
    patch.name = input.name.trim();
    patch.slug = uniqueSlug(input.name, await takenSlugs(id));
  }
  if (input.romanizedName !== undefined) patch.romanizedName = input.romanizedName ?? null;
  if (input.parentId !== undefined) patch.parentId = input.parentId;
  if (Object.keys(patch).length === 0) {
    const [existing] = await db.select().from(genreMoods).where(eq(genreMoods.id, id));
    return existing ? toGenreMood(existing) : null;
  }

  const [row] = await db.update(genreMoods).set(patch).where(eq(genreMoods.id, id)).returning();
  return row ? toGenreMood(row) : null;
}

/** Delete an entry. FK cascade removes descendants and any assignment rows. */
export async function deleteGenreMood(id: string): Promise<boolean> {
  const rows = await db.delete(genreMoods).where(eq(genreMoods.id, id)).returning({
    id: genreMoods.id,
  });
  // Cascade removes descendants + assignment rows (incl. bookmark owners) — refresh the cache.
  if (rows.length > 0) invalidateBookmarkCache();
  return rows.length > 0;
}

/** Delete many entries, reporting per-item outcomes (a cascaded descendant may report not-found). */
export function bulkDeleteGenreMoods(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteGenreMood);
}

/** Fill in slugs for any entries missing one (e.g. rows that predate the `slug` column). */
export async function backfillGenreMoodSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: genreMoods.id,
      name: genreMoods.name,
    })
    .from(genreMoods)
    .where(isNull(genreMoods.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const node of missing) {
    const slug = uniqueSlug(node.name, taken);
    taken.push(slug);
    await db.update(genreMoods).set({
      slug,
    }).where(eq(genreMoods.id, node.id));
  }
}
