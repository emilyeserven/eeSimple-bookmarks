import { and, asc, eq, ne } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateTaxonomyTermInput,
  EntityName,
  TaxonomyTerm,
  TaxonomyTermNode,
  UpdateTaxonomyTermInput,
} from "@eesimple/types";
import { db } from "@/db";
import { taxonomyAssignments, taxonomyTerms, type TaxonomyTermRow } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { deleteTaxonomyAssignmentsForOwner } from "@/services/taxonomyAssignments";
import { deleteEntityNamesForOwner, loadEntityNames } from "@/services/entityNames";
import {
  collectSubtreeIds,
  computeSubtreeBookmarkCounts,
  type SubtreeBookmarkCounts,
} from "@/utils/parentTree";
import { AppError } from "@/utils/errors";
import { slugify, uniqueSlug } from "@/utils/slug";

/** Thrown when a create/rename collides with an existing sibling term name in the same taxonomy. */
export class DuplicateTaxonomyTermError extends AppError {
  constructor(name: string) {
    super(`A term named "${name}" already exists`, "duplicateName", 409, {
      entity: "taxonomy term",
      name,
    });
  }
}

/** Thrown when a reparent would put a term under itself or one of its descendants. */
export class TaxonomyTermCycleError extends AppError {
  constructor() {
    super("Cannot move a term under itself or one of its descendants", "cycle", 400);
  }
}

/** Map a DB row (plus optional precomputed counts) to the shared `TaxonomyTerm` wire type. */
function toTaxonomyTerm(
  row: TaxonomyTermRow,
  counts?: SubtreeBookmarkCounts,
  names?: EntityName[],
): TaxonomyTerm {
  return {
    id: row.id,
    taxonomyId: row.taxonomyId,
    name: row.name,
    names: names ?? [],
    slug: row.slug ?? slugify(row.name),
    description: row.description,
    parentId: row.parentId,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: counts?.subtree,
    ownBookmarkCount: counts?.own,
  };
}

/**
 * Distinct subtree + "own" bookmark counts for a taxonomy's terms. Pure — mirrors
 * `computeGenreMoodBookmarkCounts`, delegating to the generic `parentTree` helper.
 */
export function computeTermBookmarkCounts(
  all: { id: string;
    parentId: string | null; }[],
  links: { termId: string;
    bookmarkId: string; }[],
): Map<string, SubtreeBookmarkCounts> {
  return computeSubtreeBookmarkCounts(all, links.map(link => ({
    nodeId: link.termId,
    bookmarkId: link.bookmarkId,
  })));
}

/** Build a nested term tree from a flat list (roots first). Pure. */
export function buildTermTree(all: TaxonomyTerm[]): TaxonomyTermNode[] {
  const byId = new Map<string, TaxonomyTermNode>(all.map(node => [node.id, {
    ...node,
    children: [],
  }]));
  const roots: TaxonomyTermNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/** Module-private cycle guard (mirrors tags' `wouldCreateCycle`; unexported to avoid a collision). */
function wouldCreateCycle(all: TaxonomyTerm[], id: string, newParentId: string): boolean {
  return collectSubtreeIds(all, id).has(newParentId);
}

/** Non-null slugs already used within one taxonomy, optionally excluding one term (when renaming). */
async function takenTermSlugs(taxonomyId: string, excludeId?: string): Promise<string[]> {
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

/** List a taxonomy's terms, ordered by name, with distinct bookmark counts. */
export async function listTaxonomyTerms(taxonomyId: string): Promise<TaxonomyTerm[]> {
  const rows = await db
    .select()
    .from(taxonomyTerms)
    .where(eq(taxonomyTerms.taxonomyId, taxonomyId))
    .orderBy(asc(taxonomyTerms.name));
  const links = await db
    .select({
      termId: taxonomyAssignments.termId,
      bookmarkId: taxonomyAssignments.ownerId,
    })
    .from(taxonomyAssignments)
    .where(and(
      eq(taxonomyAssignments.taxonomyId, taxonomyId),
      eq(taxonomyAssignments.ownerType, "bookmark"),
    ));
  const counts = computeTermBookmarkCounts(rows, links);
  const namesMap = await loadEntityNames("taxonomyTerm", rows.map(row => row.id));
  return rows.map(row => toTaxonomyTerm(row, counts.get(row.id), namesMap.get(row.id)));
}

/** A taxonomy's terms as a nested tree (roots first). */
export async function getTaxonomyTermTree(taxonomyId: string): Promise<TaxonomyTermNode[]> {
  return buildTermTree(await listTaxonomyTerms(taxonomyId));
}

/** Add a term to a taxonomy. Throws `DuplicateTaxonomyTermError` on a sibling name clash. */
export async function createTaxonomyTerm(
  taxonomyId: string,
  input: CreateTaxonomyTermInput,
): Promise<TaxonomyTerm> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateTaxonomyTermError(input.name);

  const slug = uniqueSlug(name, await takenTermSlugs(taxonomyId), "term");
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
  return toTaxonomyTerm(row);
}

/** Rename and/or reparent a term. */
export async function updateTaxonomyTerm(
  id: string,
  input: UpdateTaxonomyTermInput,
): Promise<TaxonomyTerm | null> {
  const [current] = await db.select().from(taxonomyTerms).where(eq(taxonomyTerms.id, id));
  if (!current) return null;

  if (input.parentId !== undefined && input.parentId !== null) {
    if (input.parentId === id) throw new TaxonomyTermCycleError();
    const all = await listTaxonomyTerms(current.taxonomyId);
    if (wouldCreateCycle(all, id, input.parentId)) throw new TaxonomyTermCycleError();
  }

  const patch: Partial<Pick<TaxonomyTermRow, "name" | "slug" | "description" | "parentId">> = {};
  if (input.name !== undefined) {
    patch.name = input.name.trim();
    patch.slug = uniqueSlug(input.name, await takenTermSlugs(current.taxonomyId, id), "term");
  }
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.parentId !== undefined) patch.parentId = input.parentId;
  if (Object.keys(patch).length === 0) return toTaxonomyTerm(current);

  const [row] = await db.update(taxonomyTerms).set(patch).where(eq(taxonomyTerms.id, id)).returning();
  return row ? toTaxonomyTerm(row) : null;
}

/** Delete a term. FK cascade removes descendants + value-side assignment rows. */
export async function deleteTaxonomyTerm(id: string): Promise<boolean> {
  const rows = await db.delete(taxonomyTerms).where(eq(taxonomyTerms.id, id)).returning({
    id: taxonomyTerms.id,
  });
  if (rows.length > 0) {
    // A term can itself be an assignment owner (a term attached to another term); `ownerId` carries
    // no cascade FK, so clean up those rows here.
    await deleteTaxonomyAssignmentsForOwner("taxonomy", id);
    await deleteEntityNamesForOwner("taxonomyTerm", id);
    invalidateBookmarkCache();
  }
  return rows.length > 0;
}

/** Delete many terms, reporting per-item outcomes (a cascaded descendant may report not-found). */
export function bulkDeleteTaxonomyTerms(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteTaxonomyTerm);
}
