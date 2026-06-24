/**
 * Author-avatar orchestration: ties the image pipeline (`utils/image`), object storage
 * (`utils/objectStore`), and the `author_images` table together so the routes stay thin.
 * Mirrors `youtubeChannelImages`. Avatars live under the `author-images/` object-storage prefix.
 *
 * Auto-fetch reads the author's stored `authorWebsiteUrl` or `biographyUrl` and pulls the page's
 * `og:image` — no client-supplied URL, so there is no SSRF amplifier.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { authorImages, authors, type AuthorImageRow, websiteFavicons, youtubeChannelImages } from "@/db/schema";
import { type EntityImageResult, fetchOgImage, withTransientRetry } from "@/services/metadata";
import { processImage } from "@/utils/image";
import { deleteObject, getObjectBytes, putObject } from "@/utils/objectStore";

function objectKeyFor(authorId: string): string {
  return `author-images/${authorId}.webp`;
}

function imageVersion(row: AuthorImageRow): number {
  const created = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
  return created.getTime();
}

export function authorImageUrl(row: AuthorImageRow): string {
  return `/api/authors/${row.authorId}/image?v=${imageVersion(row)}`;
}

export async function getAuthorImageRow(authorId: string): Promise<AuthorImageRow | null> {
  const [row] = await db
    .select()
    .from(authorImages)
    .where(eq(authorImages.authorId, authorId));
  return row ?? null;
}

async function setAuthorImage(
  authorId: string,
  rawBytes: Buffer,
  source: "upload" | "website" | "biography" | "channel" | "website-favicon",
): Promise<{ imageUrl: string } | "not_found" | "bad_image"> {
  const [author] = await db
    .select({
      id: authors.id,
    })
    .from(authors)
    .where(eq(authors.id, authorId));
  if (!author) return "not_found";

  const processed = await processImage(rawBytes);
  if (!processed) return "bad_image";

  const objectKey = objectKeyFor(authorId);
  await putObject(objectKey, processed.body, processed.contentType);

  const values = {
    authorId,
    objectKey,
    contentType: processed.contentType,
    width: processed.width,
    height: processed.height,
    byteSize: processed.body.byteLength,
    source,
    createdAt: new Date(),
  };
  const [row] = await db
    .insert(authorImages)
    .values(values)
    .onConflictDoUpdate({
      target: authorImages.authorId,
      set: values,
    })
    .returning();
  return {
    imageUrl: authorImageUrl(row),
  };
}

export async function setAuthorImageFromBytes(
  authorId: string,
  rawBytes: Buffer,
): Promise<{ imageUrl: string } | "not_found" | "bad_image"> {
  return setAuthorImage(authorId, rawBytes, "upload");
}

export async function removeAuthorImage(authorId: string): Promise<boolean> {
  const row = await getAuthorImageRow(authorId);
  if (!row) return false;
  await deleteObject(row.objectKey);
  await db.delete(authorImages).where(eq(authorImages.authorId, authorId));
  return true;
}

export async function fetchAndStoreAuthorImage(
  authorId: string,
  source: "website" | "biography",
): Promise<EntityImageResult | "no_url"> {
  const [author] = await db
    .select({
      authorWebsiteUrl: authors.authorWebsiteUrl,
      biographyUrl: authors.biographyUrl,
    })
    .from(authors)
    .where(eq(authors.id, authorId));
  if (!author) return "not_found";

  const url = source === "website" ? author.authorWebsiteUrl : author.biographyUrl;
  if (!url) return "no_url";

  const result = await withTransientRetry(() => fetchOgImage(url));
  if (typeof result === "string") return result;
  return setAuthorImage(authorId, result, source);
}

/**
 * Copy a connected YouTube channel's stored avatar to the author's own avatar.
 * The channel must already have an avatar stored in object storage.
 */
export async function adoptChannelImageForAuthor(
  authorId: string,
  channelId: string,
): Promise<{ imageUrl: string } | "not_found" | "no_image"> {
  const [imageRow] = await db
    .select()
    .from(youtubeChannelImages)
    .where(eq(youtubeChannelImages.youtubeChannelId, channelId));
  if (!imageRow) return "no_image";

  const bytes = await getObjectBytes(imageRow.objectKey);
  if (!bytes) return "no_image";

  const result = await setAuthorImage(authorId, bytes, "channel");
  if (result === "not_found" || result === "bad_image") return result === "not_found" ? "not_found" : "no_image";
  return result;
}

/**
 * Copy a connected website's stored favicon to the author's own avatar.
 * The website must already have a favicon stored in object storage.
 */
export async function adoptWebsiteFaviconForAuthor(
  authorId: string,
  websiteId: string,
): Promise<{ imageUrl: string } | "not_found" | "no_image"> {
  const [faviconRow] = await db
    .select()
    .from(websiteFavicons)
    .where(eq(websiteFavicons.websiteId, websiteId));
  if (!faviconRow) return "no_image";

  const bytes = await getObjectBytes(faviconRow.objectKey);
  if (!bytes) return "no_image";

  const result = await setAuthorImage(authorId, bytes, "website-favicon");
  if (result === "not_found" || result === "bad_image") return result === "not_found" ? "not_found" : "no_image";
  return result;
}
