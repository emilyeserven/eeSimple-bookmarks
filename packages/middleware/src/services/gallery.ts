/**
 * Gallery orchestration: catalogs every object in the storage bucket in the `media_objects` table,
 * splits it into bookmark-linked vs. orphaned, and reclaims orphans. The bucket is reconciled by a
 * manual "Scan bucket" action; image writes also keep the manifest live (see `bookmarkImages`).
 */

import type { DeleteOrphansResult, GalleryCatalog, GalleryScanResult, MediaObject } from "@eesimple/types";
import { eq, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { bookmarks, mediaObjects, type MediaObjectRow } from "@/db/schema";
import { deleteObject, listObjects } from "@/utils/objectStore";

/** The managed prefix all bookmark images live under; also guards the by-key serving route. */
export const MANAGED_PREFIX = "bookmarks/";

/** Guess a content type from a key's extension — `ListObjectsV2` doesn't return one per object. */
export function contentTypeForKey(key: string): string | null {
  const lower = key.toLowerCase();
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".avif")) return "image/avif";
  return null;
}

/** Parse the bookmark id encoded in an image key (`bookmarks/<uuid>.<ext>`), or null when it doesn't fit. */
export function bookmarkIdFromKey(key: string): string | null {
  const match = /^bookmarks\/([0-9a-f-]{36})\.[a-z0-9]+$/i.exec(key);
  return match ? match[1] : null;
}

/**
 * Resolve the bookmark id a key should link to: the id encoded in the key, but only when that
 * bookmark still exists. Otherwise the object is an orphan (null).
 */
export function resolveBookmarkId(key: string, existingIds: Set<string>): string | null {
  const candidate = bookmarkIdFromKey(key);
  return candidate && existingIds.has(candidate) ? candidate : null;
}

/**
 * Decide which requested orphan keys are safe to delete. A key is refused (skipped) when it's
 * unknown to the manifest, or still linked to a live bookmark — so a race can never delete a live
 * image. Pure so it's unit-testable without a DB.
 */
export function partitionDeletableKeys(
  requested: string[],
  rows: { objectKey: string;
    bookmarkId: string | null; }[],
): { deletable: string[];
  skipped: string[]; } {
  const linkByKey = new Map(rows.map(row => [row.objectKey, row.bookmarkId]));
  const deletable: string[] = [];
  const skipped: string[] = [];
  for (const key of requested) {
    if (!linkByKey.has(key) || linkByKey.get(key) != null) skipped.push(key);
    else deletable.push(key);
  }
  return {
    deletable,
    skipped,
  };
}

/** Build the wire shape for a manifest row, choosing the right serving URL. */
function mediaObjectFromRow(
  row: MediaObjectRow,
  bookmarkTitle: string | null,
): MediaObject {
  const linked = row.bookmarkId != null && bookmarkTitle != null;
  return {
    objectKey: row.objectKey,
    contentType: row.contentType,
    byteSize: row.byteSize,
    lastModified: row.lastModified ? row.lastModified.toISOString() : null,
    lastSeenAt: row.lastSeenAt.toISOString(),
    bookmark: linked
      ? {
        id: row.bookmarkId as string,
        title: bookmarkTitle,
      }
      : null,
    url: linked
      ? `/api/bookmarks/${row.bookmarkId}/image`
      : `/api/gallery/image?key=${encodeURIComponent(row.objectKey)}`,
  };
}

/** Read the manifest (joined to bookmarks) and split it into registered vs. orphaned objects. */
export async function getCatalog(): Promise<GalleryCatalog> {
  const rows = await db
    .select({
      object: mediaObjects,
      bookmarkTitle: bookmarks.title,
    })
    .from(mediaObjects)
    .leftJoin(bookmarks, eq(mediaObjects.bookmarkId, bookmarks.id));

  const registered: MediaObject[] = [];
  const orphans: MediaObject[] = [];
  for (const {
    object, bookmarkTitle,
  } of rows) {
    const wire = mediaObjectFromRow(object, bookmarkTitle);
    if (wire.bookmark) registered.push(wire);
    else orphans.push(wire);
  }
  const byNewest = (a: MediaObject, b: MediaObject): number =>
    (b.lastModified ?? "").localeCompare(a.lastModified ?? "");
  registered.sort(byNewest);
  orphans.sort(byNewest);

  const rawQuota = process.env.STORAGE_QUOTA_BYTES;
  const storageQuotaBytes = rawQuota ? (parseInt(rawQuota, 10) || null) : null;

  return {
    registered,
    orphans,
    storageQuotaBytes,
  };
}

/**
 * Reconcile the manifest against the live bucket: upsert a row for every object (linking it to its
 * bookmark when that bookmark still exists), then prune rows whose object is gone. This is what
 * registers a previously-unknown S3 object into the DB.
 */
export async function scanBucket(): Promise<GalleryScanResult> {
  const scanStart = new Date();
  const objects = await listObjects(MANAGED_PREFIX);

  // Which of the bookmark ids encoded in the keys actually exist?
  const candidateIds = [
    ...new Set(objects.map(obj => bookmarkIdFromKey(obj.key)).filter((id): id is string => id != null)),
  ];
  const existingRows = candidateIds.length
    ? await db.select({
      id: bookmarks.id,
    }).from(bookmarks).where(inArray(bookmarks.id, candidateIds))
    : [];
  const existingIds = new Set(existingRows.map(row => row.id));

  // Keys already in the manifest, so we can report added vs. updated.
  const knownKeys = new Set(
    (await db.select({
      objectKey: mediaObjects.objectKey,
    }).from(mediaObjects)).map(row => row.objectKey),
  );

  let added = 0;
  let updated = 0;
  for (const obj of objects) {
    const values = {
      objectKey: obj.key,
      contentType: contentTypeForKey(obj.key),
      byteSize: obj.size ?? null,
      lastModified: obj.lastModified ?? null,
      bookmarkId: resolveBookmarkId(obj.key, existingIds),
      lastSeenAt: scanStart,
    };
    if (knownKeys.has(obj.key)) updated += 1;
    else added += 1;
    await db
      .insert(mediaObjects)
      .values(values)
      .onConflictDoUpdate({
        target: mediaObjects.objectKey,
        set: values,
      });
  }

  // Rows not touched this scan describe objects no longer in the bucket — prune them.
  const prunedRows = await db
    .delete(mediaObjects)
    .where(lt(mediaObjects.lastSeenAt, scanStart))
    .returning({
      objectKey: mediaObjects.objectKey,
    });

  return {
    catalog: await getCatalog(),
    added,
    updated,
    pruned: prunedRows.length,
  };
}

/**
 * Delete orphan objects (bytes + manifest row). Re-checks each key is still unlinked right before
 * deleting and refuses any that became linked or are unknown — the deletion can never touch a live
 * image.
 */
export async function deleteOrphans(keys: string[]): Promise<DeleteOrphansResult> {
  if (keys.length === 0) return {
    deleted: [],
    skipped: [],
  };

  const rows = await db
    .select({
      objectKey: mediaObjects.objectKey,
      bookmarkId: mediaObjects.bookmarkId,
    })
    .from(mediaObjects)
    .where(inArray(mediaObjects.objectKey, keys));
  const {
    deletable, skipped,
  } = partitionDeletableKeys(keys, rows);

  for (const key of deletable) {
    await deleteObject(key);
    await db.delete(mediaObjects).where(eq(mediaObjects.objectKey, key));
  }
  return {
    deleted: deletable,
    skipped,
  };
}

/**
 * Keep the manifest live when an image is written, so the Gallery isn't stale between scans.
 * Called from `setBookmarkImage`.
 */
export async function recordManifestObject(input: {
  objectKey: string;
  contentType: string;
  byteSize: number;
  bookmarkId: string;
}): Promise<void> {
  const now = new Date();
  const values = {
    objectKey: input.objectKey,
    contentType: input.contentType,
    byteSize: input.byteSize,
    lastModified: now,
    bookmarkId: input.bookmarkId,
    lastSeenAt: now,
  };
  await db
    .insert(mediaObjects)
    .values(values)
    .onConflictDoUpdate({
      target: mediaObjects.objectKey,
      set: values,
    });
}

/** Drop a manifest row when its object is deleted. Called from `removeBookmarkImage`. */
export async function forgetManifestObject(objectKey: string): Promise<void> {
  await db.delete(mediaObjects).where(eq(mediaObjects.objectKey, objectKey));
}

/**
 * Check whether an object key is currently an orphan (exists in the manifest with no bookmark
 * link). Used by the attach route before downloading the object bytes.
 */
export async function verifyIsOrphan(key: string): Promise<boolean> {
  const [row] = await db
    .select({
      bookmarkId: mediaObjects.bookmarkId,
    })
    .from(mediaObjects)
    .where(eq(mediaObjects.objectKey, key));
  return row != null && row.bookmarkId == null;
}
