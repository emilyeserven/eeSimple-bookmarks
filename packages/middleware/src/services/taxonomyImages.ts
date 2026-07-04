/**
 * Image orchestration for the Plex/Kavita-backed media taxonomies (Movies, TV Shows, Episodes,
 * Albums, Tracks, Books): ties the image pipeline (`utils/image`) and object storage
 * (`utils/objectStore`) to the shared, polymorphic `taxonomy_images` table. Mirrors
 * `services/bookmarkImages.ts`'s multi-image gallery (up to {@link MAX_TAXONOMY_IMAGES} per owner,
 * one flagged `isMain`), but keyed by `(ownerType, ownerId)` instead of a single `bookmarkId` since
 * one physical table can't FK into six different owner tables.
 */

import type { TaxonomyImage, TaxonomyImageOwnerType } from "@eesimple/types";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { taxonomyImages, type TaxonomyImageRow } from "@/db/schema";
import { processImage } from "@/utils/image";
import { deleteObject, putObject } from "@/utils/objectStore";

export type TaxonomyImageSource = "upload" | "plex" | "kavita" | "isbn" | "podcast";
export type AddTaxonomyImageResult = TaxonomyImage | "bad_image" | "too_many";

/** Max kept images per owning entity — mirrors `MAX_BOOKMARK_IMAGES`. */
export const MAX_TAXONOMY_IMAGES = 12;

function objectKeyFor(ownerType: TaxonomyImageOwnerType, ownerId: string, imageId: string): string {
  return `taxonomy-images/${ownerType}/${ownerId}/${imageId}.webp`;
}

function imageVersion(row: { createdAt: Date | string }): number {
  const created = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
  return created.getTime();
}

function compareImageRows(a: TaxonomyImageRow, b: TaxonomyImageRow): number {
  if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return imageVersion(a) - imageVersion(b);
}

/** Map a stored-image row to the shared `TaxonomyImage` wire type. */
export function taxonomyImageFromRow(row: TaxonomyImageRow): TaxonomyImage {
  return {
    id: row.id,
    ownerType: row.ownerType as TaxonomyImageOwnerType,
    ownerId: row.ownerId,
    url: `/api/taxonomy-images/${row.id}?v=${imageVersion(row)}`,
    width: row.width,
    height: row.height,
    source: row.source as TaxonomyImageSource,
    isMain: row.isMain,
    sortOrder: row.sortOrder,
  };
}

/** All of an entity's image rows, ordered main-first then by `sortOrder`. Empty when it has none. */
export async function listTaxonomyImageRows(
  ownerType: TaxonomyImageOwnerType,
  ownerId: string,
): Promise<TaxonomyImageRow[]> {
  return db
    .select()
    .from(taxonomyImages)
    .where(and(eq(taxonomyImages.ownerType, ownerType), eq(taxonomyImages.ownerId, ownerId)))
    .orderBy(desc(taxonomyImages.isMain), asc(taxonomyImages.sortOrder), asc(taxonomyImages.createdAt));
}

/** Read one specific image row by id (scoped to its owner), or null when absent. */
export async function getTaxonomyImageRowById(
  ownerType: TaxonomyImageOwnerType,
  ownerId: string,
  imageId: string,
): Promise<TaxonomyImageRow | null> {
  const [row] = await db
    .select()
    .from(taxonomyImages)
    .where(and(
      eq(taxonomyImages.ownerType, ownerType),
      eq(taxonomyImages.ownerId, ownerId),
      eq(taxonomyImages.id, imageId),
    ));
  return row ?? null;
}

/** Read any image row by id (used by the byte-serving route, which doesn't know the owner up front). */
export async function getTaxonomyImageRow(imageId: string): Promise<TaxonomyImageRow | null> {
  const [row] = await db.select().from(taxonomyImages).where(eq(taxonomyImages.id, imageId));
  return row ?? null;
}

/**
 * Add an image to an entity, keeping its other images. Returns the wire shape, `"bad_image"` for
 * undecodable bytes, or `"too_many"` once the per-entity cap is reached. The new image becomes main
 * when `setMain` is set or it's the entity's first image.
 */
export async function addTaxonomyImage(
  ownerType: TaxonomyImageOwnerType,
  ownerId: string,
  rawBytes: Buffer,
  source: TaxonomyImageSource,
  opts?: { setMain?: boolean },
): Promise<AddTaxonomyImageResult> {
  const existing = await listTaxonomyImageRows(ownerType, ownerId);
  if (existing.length >= MAX_TAXONOMY_IMAGES) return "too_many";

  const processed = await processImage(rawBytes);
  if ("error" in processed) return "bad_image";

  const makeMain = opts?.setMain === true || existing.length === 0;
  if (makeMain && existing.length > 0) {
    await db.update(taxonomyImages).set({
      isMain: false,
    }).where(and(eq(taxonomyImages.ownerType, ownerType), eq(taxonomyImages.ownerId, ownerId)));
  }
  const nextSortOrder = existing.reduce((max, r) => Math.max(max, r.sortOrder), -1) + 1;

  const id = randomUUID();
  const objectKey = objectKeyFor(ownerType, ownerId, id);
  await putObject(objectKey, processed.body, processed.contentType);

  const [row] = await db
    .insert(taxonomyImages)
    .values({
      id,
      ownerType,
      ownerId,
      objectKey,
      contentType: processed.contentType,
      width: processed.width,
      height: processed.height,
      byteSize: processed.body.byteLength,
      source,
      isMain: makeMain,
      sortOrder: nextSortOrder,
      createdAt: new Date(),
    })
    .returning();
  return taxonomyImageFromRow(row);
}

/**
 * Make `imageId` the entity's main image (clearing the flag on its siblings). Returns the new main
 * image's wire shape, or `"not_found"` when the entity has no such image.
 */
export async function setMainTaxonomyImage(
  ownerType: TaxonomyImageOwnerType,
  ownerId: string,
  imageId: string,
): Promise<TaxonomyImage | "not_found"> {
  const target = await getTaxonomyImageRowById(ownerType, ownerId, imageId);
  if (!target) return "not_found";
  await db.update(taxonomyImages).set({
    isMain: false,
  }).where(and(eq(taxonomyImages.ownerType, ownerType), eq(taxonomyImages.ownerId, ownerId)));
  const [row] = await db
    .update(taxonomyImages)
    .set({
      isMain: true,
    })
    .where(and(
      eq(taxonomyImages.ownerType, ownerType),
      eq(taxonomyImages.ownerId, ownerId),
      eq(taxonomyImages.id, imageId),
    ))
    .returning();
  return taxonomyImageFromRow(row);
}

/**
 * Delete one image (object + row). When it was main and others remain, the next image (by display
 * order) is promoted to main. Returns whether the image existed.
 */
export async function removeTaxonomyImage(
  ownerType: TaxonomyImageOwnerType,
  ownerId: string,
  imageId: string,
): Promise<boolean> {
  const rows = await listTaxonomyImageRows(ownerType, ownerId);
  const target = rows.find(r => r.id === imageId);
  if (!target) return false;
  await deleteObject(target.objectKey);
  await db.delete(taxonomyImages).where(and(
    eq(taxonomyImages.ownerType, ownerType),
    eq(taxonomyImages.ownerId, ownerId),
    eq(taxonomyImages.id, imageId),
  ));
  if (target.isMain) {
    const next = rows.filter(r => r.id !== imageId).sort(compareImageRows)[0];
    if (next) {
      await db.update(taxonomyImages).set({
        isMain: true,
      }).where(and(
        eq(taxonomyImages.ownerType, ownerType),
        eq(taxonomyImages.ownerId, ownerId),
        eq(taxonomyImages.id, next.id),
      ));
    }
  }
  return true;
}

/**
 * Delete every image object + row for an owner — called from an owning entity's delete service
 * since `ownerId` carries no cascade FK. Mirrors `bookmarkImages.ts`'s `deleteAllBookmarkImages`:
 * when the object store isn't configured there are no rows to begin with (uploads would have
 * 503'd), so this is a no-op in that case.
 */
export async function deleteTaxonomyImagesForOwner(
  ownerType: TaxonomyImageOwnerType,
  ownerId: string,
): Promise<void> {
  const rows = await listTaxonomyImageRows(ownerType, ownerId);
  for (const row of rows) {
    await deleteObject(row.objectKey);
  }
  if (rows.length > 0) {
    await db.delete(taxonomyImages).where(and(
      eq(taxonomyImages.ownerType, ownerType),
      eq(taxonomyImages.ownerId, ownerId),
    ));
  }
}
