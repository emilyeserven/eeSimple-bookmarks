/**
 * Group-avatar/poster orchestration: ties the image pipeline (`utils/image`), object storage
 * (`utils/objectStore`), and the `group_images` table together so the routes stay thin. Mirrors
 * `personImages`. Images live under the `group-images/` object-storage prefix. Absorbed alongside
 * the Artists → People/Groups merge so a group creator gets a poster like a solo artist did.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { groupImages, groups, type GroupImageRow, websiteFavicons } from "@/db/schema";
import { type EntityImageResult } from "@/services/metadata";
import { fetchPlexPoster } from "@/services/plex";
import { processImage } from "@/utils/image";
import { deleteObject, getObjectBytes, putObject } from "@/utils/objectStore";

function objectKeyFor(groupId: string): string {
  return `group-images/${groupId}.webp`;
}

function imageVersion(row: GroupImageRow): number {
  const created = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
  return created.getTime();
}

export function groupImageUrl(row: GroupImageRow): string {
  return `/api/groups/${row.groupId}/image?v=${imageVersion(row)}`;
}

export async function getGroupImageRow(groupId: string): Promise<GroupImageRow | null> {
  const [row] = await db
    .select()
    .from(groupImages)
    .where(eq(groupImages.groupId, groupId));
  return row ?? null;
}

async function setGroupImage(
  groupId: string,
  rawBytes: Buffer,
  source: "upload" | "website" | "plex",
): Promise<{ imageUrl: string } | "not_found" | "bad_image"> {
  const [group] = await db
    .select({
      id: groups.id,
    })
    .from(groups)
    .where(eq(groups.id, groupId));
  if (!group) return "not_found";

  const processed = await processImage(rawBytes);
  if ("error" in processed) return "bad_image";

  const objectKey = objectKeyFor(groupId);
  await putObject(objectKey, processed.body, processed.contentType);

  const values = {
    groupId,
    objectKey,
    contentType: processed.contentType,
    width: processed.width,
    height: processed.height,
    byteSize: processed.body.byteLength,
    source,
    createdAt: new Date(),
  };
  const [row] = await db
    .insert(groupImages)
    .values(values)
    .onConflictDoUpdate({
      target: groupImages.groupId,
      set: values,
    })
    .returning();
  return {
    imageUrl: groupImageUrl(row),
  };
}

export async function setGroupImageFromBytes(
  groupId: string,
  rawBytes: Buffer,
): Promise<{ imageUrl: string } | "not_found" | "bad_image"> {
  return setGroupImage(groupId, rawBytes, "upload");
}

export async function removeGroupImage(groupId: string): Promise<boolean> {
  const row = await getGroupImageRow(groupId);
  if (!row) return false;
  await deleteObject(row.objectKey);
  await db.delete(groupImages).where(eq(groupImages.groupId, groupId));
  return true;
}

/**
 * Pull the group's image from its linked website's `og:image`. Reads the group's stored
 * website URL — never a client value — so there is no SSRF amplifier.
 */
export async function fetchAndStoreGroupImage(
  groupId: string,
): Promise<EntityImageResult | "no_url"> {
  const [group] = await db
    .select({
      websiteId: groups.websiteId,
    })
    .from(groups)
    .where(eq(groups.id, groupId));
  if (!group) return "not_found";
  if (!group.websiteId) return "no_url";

  // Prefer the linked website's stored favicon; fall back to fetching its og:image.
  const [faviconRow] = await db
    .select()
    .from(websiteFavicons)
    .where(eq(websiteFavicons.websiteId, group.websiteId));
  if (faviconRow) {
    const bytes = await getObjectBytes(faviconRow.objectKey);
    if (bytes) return setGroupImage(groupId, bytes, "website");
  }
  return "no_url";
}

/** Import the group's linked Plex item's poster as its image. */
export async function fetchAndStoreGroupImageFromPlex(
  groupId: string,
): Promise<EntityImageResult | "no_url"> {
  const [group] = await db
    .select({
      plexRatingKey: groups.plexRatingKey,
    })
    .from(groups)
    .where(eq(groups.id, groupId));
  if (!group) return "not_found";
  if (!group.plexRatingKey) return "no_url";

  const bytes = await fetchPlexPoster(group.plexRatingKey);
  if (!bytes) return "no_image";
  return setGroupImage(groupId, bytes, "plex");
}
