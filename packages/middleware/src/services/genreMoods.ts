import { and, asc, eq, ne } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateGenreMoodInput,
  EntityName,
  GenreMood,
  GenreMoodNode,
  UpdateGenreMoodInput,
} from "@eesimple/types";
import { db } from "@/db";
import { taxonomyAssignments, taxonomyTerms, type TaxonomyTermRow } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { deleteTaxonomyAssignmentsForOwner } from "@/services/taxonomyAssignments";
import { getGenreMoodsTaxonomyId } from "@/services/taxonomies";
import { deleteEntityNamesForOwner, loadEntityNames } from "@/services/entityNames";
import {
  collectSubtreeIds,
  computeSubtreeBookmarkCounts,
  type SubtreeBookmarkCounts,
} from "@/utils/parentTree";
import { AppError } from "@/utils/errors";
import { slugify, uniqueSlug } from "@/utils/slug";

/**
 * "Genres & Moods" service — after the cutover, G&M is an ordinary built-in taxonomy, so these legacy
 * functions read/write the generic `taxonomy_terms` / `taxonomy_assignments` tables scoped to the G&M
 * taxonomy id. The wire type (`GenreMood`) and every caller (routes, hydration, the client) are
 * unchanged; only the storage moved. When the G&M taxonomy has been demoted away, reads return empty
 * and writes throw.
 */

/** Thrown when a create/rename collides with an existing entry name under the same parent. */
export class DuplicateGenreMoodError extends AppError {
  constructor(name: string) {
    super(`A Genres & Moods entry named "${name}" already exists`, "duplicateName", 409, {
      entity: "Genres & Moods entry",
      name,
    });
  }
}

/** Thrown when a reparent would put an entry under itself or one of its descendants. */
export class GenreMoodCycleError extends AppError {
  constructor() {
    super("Cannot move an entry under itself or one of its descendants", "cycle", 400);
  }
}

/** Thrown when the G&M taxonomy has been demoted to Tags and no longer exists. */
class GenreMoodsRetiredError extends AppError {
  constructor() {
    super("Genres & Moods has been demoted to Tags", "notFound", 404);
  }
}

/** Map a taxonomy-term row (plus optional precomputed counts) to the shared `GenreMood` wire type. */
function toGenreMood(row: TaxonomyTermRow, counts?: SubtreeBookmarkCounts, names?: EntityName[]): GenreMood {
  return {
    id: row.id,
    name: row.name,
    names: names ?? [],
    slug: row.slug ?? slugify(row.name),
    description: row.description,
    parentId: row.parentId,
    isFavorite: row.isFavorite,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: counts?.subtree,
    ownBookmarkCount: counts?.own,
  };
}

/** Distinct subtree + "own" bookmark counts from a flat list + the bookmark links. Pure. */
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

/** Build a nested tree from a flat list (roots first). Pure. */
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

function wouldCreateCycle(all: GenreMood[], id: string, newParentId: string): boolean {
  return collectSubtreeIds(all, id).has(newParentId);
}

/** Existing G&M term slugs, optionally excluding one term (when renaming). */
async function takenSlugs(taxonomyId: string, excludeId?: string): Promise<string[]> {
  const rows = await db
    .select({
      slug: taxonomyTerms.slug,
    })
    .from(taxonomyTerms)
    .where(excludeId
      ? and(eq(taxonomyTerms.taxonomyId, taxonomyId), ne(taxonomyTerms.id, excludeId))
      : eq(taxonomyTerms.taxonomyId, taxonomyId));
  return rows.map(r => r.slug).filter((s): s is string => typeof s === "string");
}

/** List every G&M entry, ordered by name, with distinct bookmark counts. */
export async function listGenreMoods(): Promise<GenreMood[]> {
  const taxonomyId = await getGenreMoodsTaxonomyId();
  if (!taxonomyId) return [];
  const rows = await db
    .select()
    .from(taxonomyTerms)
    .where(eq(taxonomyTerms.taxonomyId, taxonomyId))
    .orderBy(asc(taxonomyTerms.name));
  const links = await db
    .select({
      genreMoodId: taxonomyAssignments.termId,
      bookmarkId: taxonomyAssignments.ownerId,
    })
    .from(taxonomyAssignments)
    .where(and(
      eq(taxonomyAssignments.taxonomyId, taxonomyId),
      eq(taxonomyAssignments.ownerType, "bookmark"),
    ));
  const counts = computeGenreMoodBookmarkCounts(rows, links);
  const namesMap = await loadEntityNames("taxonomyTerm", rows.map(row => row.id));
  return rows.map(row => toGenreMood(row, counts.get(row.id), namesMap.get(row.id)));
}

/** The full taxonomy as a nested tree (roots first). */
export async function getGenreMoodTree(): Promise<GenreMoodNode[]> {
  return buildGenreMoodTree(await listGenreMoods());
}

/** Add an entry. */
export async function createGenreMood(input: CreateGenreMoodInput): Promise<GenreMood> {
  const taxonomyId = await getGenreMoodsTaxonomyId();
  if (!taxonomyId) throw new GenreMoodsRetiredError();
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateGenreMoodError(input.name);

  const slug = uniqueSlug(name, await takenSlugs(taxonomyId), "genre-mood");
  const [row] = await db
    .insert(taxonomyTerms)
    .values({
      taxonomyId,
      name,
      slug,
      description: input.description ?? null,
      parentId: input.parentId ?? null,
    })
    .returning();
  invalidateBookmarkCache();
  return toGenreMood(row);
}

/** Rename and/or reparent an entry. */
export async function updateGenreMood(
  id: string,
  input: UpdateGenreMoodInput,
): Promise<GenreMood | null> {
  const taxonomyId = await getGenreMoodsTaxonomyId();
  if (!taxonomyId) return null;
  if (input.parentId !== undefined && input.parentId !== null) {
    if (input.parentId === id) throw new GenreMoodCycleError();
    const all = await listGenreMoods();
    if (wouldCreateCycle(all, id, input.parentId)) throw new GenreMoodCycleError();
  }

  const patch: Partial<Pick<TaxonomyTermRow, "name" | "slug" | "description" | "parentId" | "isFavorite">> = {};
  if (input.name !== undefined) {
    patch.name = input.name.trim();
    patch.slug = uniqueSlug(input.name, await takenSlugs(taxonomyId, id), "genre-mood");
  }
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.parentId !== undefined) patch.parentId = input.parentId;
  if (input.isFavorite !== undefined) patch.isFavorite = input.isFavorite;
  if (Object.keys(patch).length === 0) {
    const [existing] = await db.select().from(taxonomyTerms).where(eq(taxonomyTerms.id, id));
    return existing ? toGenreMood(existing) : null;
  }

  const [row] = await db.update(taxonomyTerms).set(patch).where(eq(taxonomyTerms.id, id)).returning();
  if (row) invalidateBookmarkCache();
  return row ? toGenreMood(row) : null;
}

/** Delete an entry. FK cascade removes descendants and any assignment rows on the value side. */
export async function deleteGenreMood(id: string): Promise<boolean> {
  const rows = await db.delete(taxonomyTerms).where(eq(taxonomyTerms.id, id)).returning({
    id: taxonomyTerms.id,
  });
  if (rows.length > 0) {
    await deleteTaxonomyAssignmentsForOwner("taxonomy", id);
    await deleteEntityNamesForOwner("taxonomyTerm", id);
    invalidateBookmarkCache();
  }
  return rows.length > 0;
}

/** Delete many entries, reporting per-item outcomes. */
export function bulkDeleteGenreMoods(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteGenreMood);
}
