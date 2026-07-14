import { and, eq, inArray, or } from "drizzle-orm";
import type {
  BookmarkGenreMood,
  BookmarkGroup,
  BookmarkLocation,
  BookmarkPerson,
  BookmarkRelationship,
  BookmarkTag,
  RelationshipRole,
} from "@eesimple/types";
import { db } from "@/db";
import {
  bookmarkGroups,
  bookmarkLocationBlacklist,
  bookmarkLocations,
  bookmarkPeople,
  bookmarkRelationships,
  bookmarks,
  bookmarkTagBlacklist,
  bookmarkTags,
  groups,
  locationRelations,
  locations,
  people,
  relationshipTypes,
  tags,
  taxonomyAssignments,
  taxonomyTerms,
} from "@/db/schema";
import { getGenreMoodsTaxonomyId } from "@/services/taxonomies";
import { slugify } from "@/utils/slug";

/** Load blacklisted tag IDs for a set of bookmark ids in a single query, grouped by bookmark id. */
export async function blacklistedTagIdsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, string[]>> {
  const grouped = new Map<string, string[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkTagBlacklist.bookmarkId,
      tagId: bookmarkTagBlacklist.tagId,
    })
    .from(bookmarkTagBlacklist)
    .where(inArray(bookmarkTagBlacklist.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push(row.tagId);
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load blacklisted location IDs for a set of bookmark ids in a single query, grouped by bookmark id. */
export async function blacklistedLocationIdsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, string[]>> {
  const grouped = new Map<string, string[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkLocationBlacklist.bookmarkId,
      locationId: bookmarkLocationBlacklist.locationId,
    })
    .from(bookmarkLocationBlacklist)
    .where(inArray(bookmarkLocationBlacklist.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push(row.locationId);
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load people for a set of bookmark ids in a single query, grouped by bookmark id. */
export async function peopleByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkPerson[]>> {
  const grouped = new Map<string, BookmarkPerson[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkPeople.bookmarkId,
      id: people.id,
      name: people.name,
      slug: people.slug,
    })
    .from(bookmarkPeople)
    .innerJoin(people, eq(bookmarkPeople.personId, people.id))
    .where(inArray(bookmarkPeople.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      slug: row.slug ?? slugify(row.name),
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load group (creator) credits for a set of bookmark ids in one query, grouped by bookmark id. */
export async function groupsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkGroup[]>> {
  const grouped = new Map<string, BookmarkGroup[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkGroups.bookmarkId,
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
    })
    .from(bookmarkGroups)
    .innerJoin(groups, eq(bookmarkGroups.groupId, groups.id))
    .where(inArray(bookmarkGroups.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      slug: row.slug ?? slugify(row.name),
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load tags for a set of bookmark ids in a single query, grouped by bookmark id. */
export async function tagsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkTag[]>> {
  const grouped = new Map<string, BookmarkTag[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkTags.bookmarkId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      parentId: tags.parentId,
      editableOnCard: tags.editableOnCard,
    })
    .from(bookmarkTags)
    .innerJoin(tags, eq(bookmarkTags.tagId, tags.id))
    .where(inArray(bookmarkTags.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      slug: row.slug ?? slugify(row.name),
      parentId: row.parentId,
      editableOnCard: row.editableOnCard,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/**
 * Load Genres & Moods entries for a set of bookmark ids, grouped by bookmark id. After the cutover
 * G&M is an ordinary taxonomy, so this reads `taxonomy_assignments` scoped to the G&M taxonomy id
 * joined to `taxonomy_terms`. Returns an empty map when G&M has been demoted away.
 */
export async function genreMoodsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkGenreMood[]>> {
  const grouped = new Map<string, BookmarkGenreMood[]>();
  if (bookmarkIds.length === 0) return grouped;
  const taxonomyId = await getGenreMoodsTaxonomyId();
  if (!taxonomyId) return grouped;

  const rows = await db
    .select({
      bookmarkId: taxonomyAssignments.ownerId,
      id: taxonomyTerms.id,
      name: taxonomyTerms.name,
      slug: taxonomyTerms.slug,
      parentId: taxonomyTerms.parentId,
    })
    .from(taxonomyAssignments)
    .innerJoin(taxonomyTerms, eq(taxonomyAssignments.termId, taxonomyTerms.id))
    .where(and(
      eq(taxonomyAssignments.taxonomyId, taxonomyId),
      eq(taxonomyAssignments.ownerType, "bookmark"),
      inArray(taxonomyAssignments.ownerId, bookmarkIds),
    ));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      slug: row.slug ?? slugify(row.name),
      parentId: row.parentId,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load locations for a set of bookmark ids in a single query, grouped by bookmark id. */
export async function locationsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkLocation[]>> {
  const grouped = new Map<string, BookmarkLocation[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkLocations.bookmarkId,
      id: locations.id,
      name: locations.name,
      slug: locations.slug,
      parentId: locations.parentId,
      placeType: locations.placeType,
      relationId: locationRelations.id,
      relationName: locationRelations.name,
      relationSlug: locationRelations.slug,
    })
    .from(bookmarkLocations)
    .innerJoin(locations, eq(bookmarkLocations.locationId, locations.id))
    .leftJoin(locationRelations, eq(bookmarkLocations.locationRelationId, locationRelations.id))
    .where(inArray(bookmarkLocations.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      slug: row.slug ?? slugify(row.name),
      parentId: row.parentId,
      placeType: row.placeType,
      locationRelation: row.relationId
        ? {
          id: row.relationId,
          name: row.relationName ?? "",
          slug: row.relationSlug ?? slugify(row.relationName ?? ""),
        }
        : null,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/**
 * Load typed relationships for a set of bookmark ids, handling both sides of each edge. Returns a
 * map of bookmarkId → its {@link BookmarkRelationship}s, with the other bookmark's role derived from
 * the edge direction: for a directional type, A is the parent and B the child; symmetric types are
 * `related`. Each row is joined to its relationship type for the name + `directional` flag.
 */
export async function relationshipsByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkRelationship[]>> {
  const grouped = new Map<string, BookmarkRelationship[]>();
  if (bookmarkIds.length === 0) return grouped;

  const idSet = new Set(bookmarkIds);

  const rels = await db
    .select({
      bookmarkAId: bookmarkRelationships.bookmarkAId,
      bookmarkBId: bookmarkRelationships.bookmarkBId,
      relationshipTypeId: bookmarkRelationships.relationshipTypeId,
      label: bookmarkRelationships.label,
      typeName: relationshipTypes.name,
      typeBuiltIn: relationshipTypes.builtIn,
      directional: relationshipTypes.directional,
    })
    .from(bookmarkRelationships)
    .innerJoin(
      relationshipTypes,
      eq(bookmarkRelationships.relationshipTypeId, relationshipTypes.id),
    )
    .where(
      or(
        inArray(bookmarkRelationships.bookmarkAId, bookmarkIds),
        inArray(bookmarkRelationships.bookmarkBId, bookmarkIds),
      ),
    );

  if (rels.length === 0) return grouped;

  // Collect all "other" bookmark ids we need to fetch (may include ids outside our batch).
  const otherIds = new Set<string>();
  for (const rel of rels) {
    if (idSet.has(rel.bookmarkAId)) otherIds.add(rel.bookmarkBId);
    if (idSet.has(rel.bookmarkBId)) otherIds.add(rel.bookmarkAId);
  }

  const otherRows = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
    })
    .from(bookmarks)
    .where(inArray(bookmarks.id, [...otherIds]));

  const otherById = new Map(otherRows.map(row => [row.id, row]));

  for (const rel of rels) {
    const addTo = (ownId: string, otherId: string, ownIsParent: boolean) => {
      if (!idSet.has(ownId)) return;
      const other = otherById.get(otherId);
      if (!other) return;
      const role: RelationshipRole = !rel.directional
        ? "related"
        : ownIsParent
          ? "child" // the OTHER bookmark is the child
          : "parent";
      const list = grouped.get(ownId) ?? [];
      list.push({
        bookmark: {
          id: other.id,
          url: other.url ?? null,
          title: other.title,
        },
        relationshipTypeId: rel.relationshipTypeId,
        relationshipTypeName: rel.typeName,
        relationshipTypeBuiltIn: rel.typeBuiltIn ?? false,
        directional: rel.directional,
        role,
        label: rel.label,
      });
      grouped.set(ownId, list);
    };
    // A is the parent/source, B is the child/target (for directional types).
    addTo(rel.bookmarkAId, rel.bookmarkBId, true);
    addTo(rel.bookmarkBId, rel.bookmarkAId, false);
  }

  return grouped;
}
