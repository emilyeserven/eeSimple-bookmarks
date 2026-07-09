import { and, asc, eq, inArray } from "drizzle-orm";
import type { BookmarkTaxonomyTerm, TaxonomyOwnerType } from "@eesimple/types";
import { db } from "@/db";
import { taxonomies, taxonomyAssignments, taxonomyTerms } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCacheVersion";
import { slugify } from "@/utils/slug";

/** Columns selected for the lightweight `BookmarkTaxonomyTerm` shape. */
const termSelection = {
  id: taxonomyTerms.id,
  taxonomyId: taxonomyTerms.taxonomyId,
  name: taxonomyTerms.name,
  slug: taxonomyTerms.slug,
  parentId: taxonomyTerms.parentId,
};

function toBookmarkTaxonomyTerm(row: {
  id: string;
  taxonomyId: string;
  name: string;
  slug: string | null;
  parentId: string | null;
}): BookmarkTaxonomyTerm {
  return {
    id: row.id,
    taxonomyId: row.taxonomyId,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    parentId: row.parentId,
  };
}

/** The taxonomy terms attached to a single owner (bookmark or taxonomy entity), across all taxonomies. */
export async function getOwnerTaxonomyTerms(
  ownerType: TaxonomyOwnerType,
  ownerId: string,
): Promise<BookmarkTaxonomyTerm[]> {
  const rows = await db
    .select(termSelection)
    .from(taxonomyAssignments)
    .innerJoin(taxonomyTerms, eq(taxonomyAssignments.termId, taxonomyTerms.id))
    .where(and(
      eq(taxonomyAssignments.ownerType, ownerType),
      eq(taxonomyAssignments.ownerId, ownerId),
    ))
    .orderBy(asc(taxonomyTerms.name));
  return rows.map(toBookmarkTaxonomyTerm);
}

/**
 * The taxonomy terms attached to every owner in `ownerIds` of one `ownerType`, grouped by `ownerId`.
 * The batched, denormalized read loader reused by bookmark hydration (no N+1). Empty map when
 * `ownerIds` is empty.
 */
export async function loadTaxonomyTermsForOwners(
  ownerType: TaxonomyOwnerType,
  ownerIds: string[],
): Promise<Map<string, BookmarkTaxonomyTerm[]>> {
  const result = new Map<string, BookmarkTaxonomyTerm[]>();
  if (ownerIds.length === 0) return result;
  const rows = await db
    .select({
      ...termSelection,
      ownerId: taxonomyAssignments.ownerId,
    })
    .from(taxonomyAssignments)
    .innerJoin(taxonomyTerms, eq(taxonomyAssignments.termId, taxonomyTerms.id))
    .where(and(
      eq(taxonomyAssignments.ownerType, ownerType),
      inArray(taxonomyAssignments.ownerId, ownerIds),
    ))
    .orderBy(asc(taxonomyTerms.name));
  for (const row of rows) {
    const list = result.get(row.ownerId) ?? [];
    list.push(toBookmarkTaxonomyTerm(row));
    result.set(row.ownerId, list);
  }
  return result;
}

/**
 * The term ids of one taxonomy attached to every owner of one `ownerType`, grouped by `ownerId`.
 * Powers the bookmark-listing "Media" tab independent-match check without an N+1.
 */
export async function listTermIdsByOwnerType(
  taxonomyId: string,
  ownerType: TaxonomyOwnerType,
): Promise<Record<string, string[]>> {
  const rows = await db
    .select({
      ownerId: taxonomyAssignments.ownerId,
      termId: taxonomyAssignments.termId,
    })
    .from(taxonomyAssignments)
    .where(and(
      eq(taxonomyAssignments.taxonomyId, taxonomyId),
      eq(taxonomyAssignments.ownerType, ownerType),
    ));
  const byOwner: Record<string, string[]> = {};
  for (const row of rows) {
    (byOwner[row.ownerId] ??= []).push(row.termId);
  }
  return byOwner;
}

/**
 * Replace the full set of one taxonomy's terms attached to one owner — a delete-then-insert scoped to
 * `(taxonomyId, ownerType, ownerId)`, so writing taxonomy A never clobbers taxonomy B on the same
 * owner. A single-value taxonomy is truncated to at most one term (defence in depth — the row set can
 * never exceed one regardless of caller). Bookmark owners refresh the bookmark cache (matchable data).
 */
export async function setOwnerTaxonomyTerms(
  taxonomyId: string,
  ownerType: TaxonomyOwnerType,
  ownerId: string,
  termIds: string[],
): Promise<BookmarkTaxonomyTerm[]> {
  const [taxonomy] = await db
    .select({
      singleValue: taxonomies.singleValue,
    })
    .from(taxonomies)
    .where(eq(taxonomies.id, taxonomyId));
  let unique = [...new Set(termIds)];
  if (taxonomy?.singleValue && unique.length > 1) unique = unique.slice(0, 1);

  await db.transaction(async (tx) => {
    await tx.delete(taxonomyAssignments).where(and(
      eq(taxonomyAssignments.taxonomyId, taxonomyId),
      eq(taxonomyAssignments.ownerType, ownerType),
      eq(taxonomyAssignments.ownerId, ownerId),
    ));
    if (unique.length > 0) {
      await tx.insert(taxonomyAssignments).values(unique.map(termId => ({
        taxonomyId,
        termId,
        ownerType,
        ownerId,
      })));
    }
  });
  if (ownerType === "bookmark") invalidateBookmarkCache();
  return getOwnerTaxonomyTerms(ownerType, ownerId);
}

/**
 * Remove every taxonomy attachment (across all taxonomies) for one owner. Called from each owner
 * entity's delete service (bookmark + all taxonomies) since `ownerId` carries no cascade FK.
 */
export async function deleteTaxonomyAssignmentsForOwner(
  ownerType: TaxonomyOwnerType,
  ownerId: string,
): Promise<void> {
  await db.delete(taxonomyAssignments).where(and(
    eq(taxonomyAssignments.ownerType, ownerType),
    eq(taxonomyAssignments.ownerId, ownerId),
  ));
  if (ownerType === "bookmark") invalidateBookmarkCache();
}
