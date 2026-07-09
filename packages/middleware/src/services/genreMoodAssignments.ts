import type { BookmarkGenreMood, GenreMoodOwnerType, TaxonomyOwnerType } from "@eesimple/types";
import {
  getOwnerTaxonomyTerms,
  listTermIdsByOwnerType,
  setOwnerTaxonomyTerms,
} from "@/services/taxonomyAssignments";
import { getGenreMoodsTaxonomyId } from "@/services/taxonomies";

/**
 * Legacy "Genres & Moods assignment" service — after the cutover, G&M is an ordinary taxonomy, so
 * these delegate to the generic taxonomy-assignment service scoped to the G&M taxonomy id. The
 * `genreMood` self-owner type maps to the generic `taxonomy` owner. Callers (routes, the client)
 * are unchanged. The old `deleteGenreMoodAssignmentsForOwner` is gone — every owner delete already
 * calls `deleteTaxonomyAssignmentsForOwner`, which removes G&M rows too.
 */

/** Map the legacy `genreMood` self-owner to the generic `taxonomy` owner; pass every other type through. */
function toTaxonomyOwnerType(ownerType: GenreMoodOwnerType): TaxonomyOwnerType {
  return ownerType === "genreMood" ? "taxonomy" : ownerType;
}

/** The Genres & Moods entries attached to a single owner. */
export async function getOwnerGenreMoods(
  ownerType: GenreMoodOwnerType,
  ownerId: string,
): Promise<BookmarkGenreMood[]> {
  const taxonomyId = await getGenreMoodsTaxonomyId();
  if (!taxonomyId) return [];
  const terms = await getOwnerTaxonomyTerms(toTaxonomyOwnerType(ownerType), ownerId);
  return terms.filter(term => term.taxonomyId === taxonomyId);
}

/** The Genres & Moods ids attached to every owner of one `ownerType`, grouped by `ownerId`. */
export async function listGenreMoodIdsByOwnerType(
  ownerType: GenreMoodOwnerType,
): Promise<Record<string, string[]>> {
  const taxonomyId = await getGenreMoodsTaxonomyId();
  if (!taxonomyId) return {};
  return listTermIdsByOwnerType(taxonomyId, toTaxonomyOwnerType(ownerType));
}

/** Replace the full set of Genres & Moods entries attached to one owner. */
export async function setOwnerGenreMoods(
  ownerType: GenreMoodOwnerType,
  ownerId: string,
  genreMoodIds: string[],
): Promise<BookmarkGenreMood[]> {
  const taxonomyId = await getGenreMoodsTaxonomyId();
  if (!taxonomyId) return [];
  return setOwnerTaxonomyTerms(taxonomyId, toTaxonomyOwnerType(ownerType), ownerId, genreMoodIds);
}
