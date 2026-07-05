import { and, asc, eq } from "drizzle-orm";
import type { LocationAssignmentOwnerType, OwnerLocation } from "@eesimple/types";
import { db } from "@/db";
import { locationAssignments, locations } from "@/db/schema";
import { slugify } from "@/utils/slug";

/** The Locations attached to a single owner (a media taxonomy entity). */
export async function getOwnerLocations(
  ownerType: LocationAssignmentOwnerType,
  ownerId: string,
): Promise<OwnerLocation[]> {
  const rows = await db
    .select({
      id: locations.id,
      name: locations.name,
      slug: locations.slug,
      parentId: locations.parentId,
    })
    .from(locationAssignments)
    .innerJoin(locations, eq(locationAssignments.locationId, locations.id))
    .where(and(
      eq(locationAssignments.ownerType, ownerType),
      eq(locationAssignments.ownerId, ownerId),
    ))
    .orderBy(asc(locations.name));
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    parentId: row.parentId,
  }));
}

/**
 * Replace the full set of Locations attached to one owner (delete-then-insert for that owner only).
 */
export async function setOwnerLocations(
  ownerType: LocationAssignmentOwnerType,
  ownerId: string,
  locationIds: string[],
): Promise<OwnerLocation[]> {
  const unique = [...new Set(locationIds)];
  await db.transaction(async (tx) => {
    await tx.delete(locationAssignments).where(and(
      eq(locationAssignments.ownerType, ownerType),
      eq(locationAssignments.ownerId, ownerId),
    ));
    if (unique.length > 0) {
      await tx.insert(locationAssignments).values(unique.map(locationId => ({
        locationId,
        ownerType,
        ownerId,
      })));
    }
  });
  return getOwnerLocations(ownerType, ownerId);
}

/**
 * Remove every Location attachment for one owner. Called from each owner entity's delete service
 * since `ownerId` carries no cascade FK.
 */
export async function deleteLocationAssignmentsForOwner(
  ownerType: LocationAssignmentOwnerType,
  ownerId: string,
): Promise<void> {
  await db.delete(locationAssignments).where(and(
    eq(locationAssignments.ownerType, ownerType),
    eq(locationAssignments.ownerId, ownerId),
  ));
}
