/**
 * Person-avatar orchestration: ties the image pipeline (`utils/image`), object storage
 * (`utils/objectStore`), and the `person_images` table together so the routes stay thin.
 * Mirrors `youtubeChannelImages`. Avatars live under the `person-images/` object-storage prefix.
 *
 * Auto-fetch reads the person's stored labeled-websites list (the "Website" / "Biography" row) and
 * pulls the page's `og:image` — no client-supplied URL, so there is no SSRF amplifier.
 */

import type { LabeledWebsite, SocialLink, SocialMediaPlatform } from "@eesimple/types";

import { eq } from "drizzle-orm";
import { socialAccountFromLink } from "@eesimple/types";
import { db } from "@/db";
import { personImages, people, type PersonImageRow, websiteFavicons, youtubeChannelImages } from "@/db/schema";
import { downloadImage, type EntityImageResult, extractImageUrl, fetchHeadOrImageError, fetchOgImage, isPublicHttpUrl, withTransientRetry } from "@/services/metadata";
import { fetchSocialProfileImageUrl } from "@/services/socialImages";
import { processImage } from "@/utils/image";
import { deleteObject, getObjectBytes, putObject } from "@/utils/objectStore";

function objectKeyFor(personId: string): string {
  return `person-images/${personId}.webp`;
}

/**
 * Resolve the avatar source URL from a person's labeled-websites list. `"website"` prefers the row
 * labeled "Website" (else the first listed URL); `"biography"` matches the "Biography" row only, so
 * it never mistakes an unrelated link for the biography source.
 */
function sourceUrlFromLabeled(
  labeledWebsites: LabeledWebsite[] | null,
  source: "website" | "biography",
): string | null {
  const list = labeledWebsites ?? [];
  const wanted = source === "website" ? "website" : "biography";
  const labeled = list.find(w => w.label.trim().toLowerCase() === wanted)?.url;
  if (labeled) return labeled;
  return source === "website" ? list[0]?.url ?? null : null;
}

function imageVersion(row: PersonImageRow): number {
  const created = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
  return created.getTime();
}

export function personImageUrl(row: PersonImageRow): string {
  return `/api/people/${row.personId}/image?v=${imageVersion(row)}`;
}

export async function getPersonImageRow(personId: string): Promise<PersonImageRow | null> {
  const [row] = await db
    .select()
    .from(personImages)
    .where(eq(personImages.personId, personId));
  return row ?? null;
}

async function setPersonImage(
  personId: string,
  rawBytes: Buffer,
  source: "upload" | "website" | "biography" | "channel" | "website-favicon" | "social",
): Promise<{ imageUrl: string } | "not_found" | "bad_image"> {
  const [person] = await db
    .select({
      id: people.id,
    })
    .from(people)
    .where(eq(people.id, personId));
  if (!person) return "not_found";

  const processed = await processImage(rawBytes);
  if ("error" in processed) return "bad_image";

  const objectKey = objectKeyFor(personId);
  await putObject(objectKey, processed.body, processed.contentType);

  const values = {
    personId,
    objectKey,
    contentType: processed.contentType,
    width: processed.width,
    height: processed.height,
    byteSize: processed.body.byteLength,
    source,
    createdAt: new Date(),
  };
  const [row] = await db
    .insert(personImages)
    .values(values)
    .onConflictDoUpdate({
      target: personImages.personId,
      set: values,
    })
    .returning();
  return {
    imageUrl: personImageUrl(row),
  };
}

export async function setPersonImageFromBytes(
  personId: string,
  rawBytes: Buffer,
): Promise<{ imageUrl: string } | "not_found" | "bad_image"> {
  return setPersonImage(personId, rawBytes, "upload");
}

export async function removePersonImage(personId: string): Promise<boolean> {
  const row = await getPersonImageRow(personId);
  if (!row) return false;
  await deleteObject(row.objectKey);
  await db.delete(personImages).where(eq(personImages.personId, personId));
  return true;
}

export async function fetchAndStorePersonImage(
  personId: string,
  source: "website" | "biography",
): Promise<EntityImageResult | "no_url"> {
  const [person] = await db
    .select({
      labeledWebsites: people.labeledWebsites,
    })
    .from(people)
    .where(eq(people.id, personId));
  if (!person) return "not_found";

  const url = sourceUrlFromLabeled(person.labeledWebsites as LabeledWebsite[] | null, source);
  if (!url) return "no_url";

  const result = await withTransientRetry(() => fetchOgImage(url));
  if (typeof result === "string") return result;
  return setPersonImage(personId, result, source);
}

/**
 * Pull the person's avatar from one of their stored social accounts (Instagram for now). Reads the
 * person's `socialLinks` for the requested platform, resolves the account's profile image via
 * `fetchSocialProfileImageUrl` (API path when configured, else keyless scrape), SSRF-guards the URL,
 * downloads it, and stores it as the person's avatar. The image URL comes from the person's own
 * stored link — never a client value — so there is no SSRF amplifier.
 */
export async function fetchAndStorePersonImageFromSocial(
  personId: string,
  platform: SocialMediaPlatform,
): Promise<EntityImageResult | "no_url"> {
  const [person] = await db
    .select({
      socialLinks: people.socialLinks,
    })
    .from(people)
    .where(eq(people.id, personId));
  if (!person) return "not_found";

  const link = (person.socialLinks as SocialLink[]).find(l => l.platform === platform);
  if (!link) return "no_url";

  const ref = socialAccountFromLink(link);
  if (!ref) return "no_url";

  const imageUrl = await fetchSocialProfileImageUrl(ref);
  if (!imageUrl || !isPublicHttpUrl(imageUrl)) return "no_image";

  const bytes = await downloadImage(imageUrl, ref.profileUrl);
  if (!bytes) return "bad_image";

  return setPersonImage(personId, bytes, "social");
}

/**
 * Resolve a person's source avatar URL WITHOUT downloading or storing it — the same candidate the
 * auto-fetch (`fetchAndStorePersonImage` / `fetchAndStorePersonImageFromSocial`) would grab, so a
 * client can preview the new avatar before applying. `"website"` / `"biography"` og:image-resolve the
 * person's stored URL; `"social"` resolves the requested platform account's profile image. Returns a
 * public http(s) URL, or `null` when the person is gone / no source URL is configured / none resolves.
 * The URL comes from the person's own stored data — never a client value — so there is no SSRF amplifier.
 */
export async function resolvePersonImageUrl(
  personId: string,
  source: "website" | "biography" | "social",
  platform?: SocialMediaPlatform,
): Promise<string | null> {
  if (source === "social") {
    if (!platform) return null;
    const [person] = await db
      .select({
        socialLinks: people.socialLinks,
      })
      .from(people)
      .where(eq(people.id, personId));
    if (!person) return null;
    const link = (person.socialLinks as SocialLink[]).find(l => l.platform === platform);
    if (!link) return null;
    const ref = socialAccountFromLink(link);
    if (!ref) return null;
    const imageUrl = await fetchSocialProfileImageUrl(ref);
    return imageUrl && isPublicHttpUrl(imageUrl) ? imageUrl : null;
  }

  const [person] = await db
    .select({
      labeledWebsites: people.labeledWebsites,
    })
    .from(people)
    .where(eq(people.id, personId));
  if (!person) return null;

  const url = sourceUrlFromLabeled(person.labeledWebsites as LabeledWebsite[] | null, source);
  if (!url) return null;

  const html = await fetchHeadOrImageError(url);
  if (typeof html !== "string") return null;
  const imageUrl = extractImageUrl(html, url);
  return imageUrl && isPublicHttpUrl(imageUrl) ? imageUrl : null;
}

/**
 * Copy a connected YouTube channel's stored avatar to the person's own avatar.
 * The channel must already have an avatar stored in object storage.
 */
export async function adoptChannelImageForPerson(
  personId: string,
  channelId: string,
): Promise<{ imageUrl: string } | "not_found" | "no_image"> {
  const [imageRow] = await db
    .select()
    .from(youtubeChannelImages)
    .where(eq(youtubeChannelImages.youtubeChannelId, channelId));
  if (!imageRow) return "no_image";

  const bytes = await getObjectBytes(imageRow.objectKey);
  if (!bytes) return "no_image";

  const result = await setPersonImage(personId, bytes, "channel");
  if (result === "not_found" || result === "bad_image") return result === "not_found" ? "not_found" : "no_image";
  return result;
}

/**
 * Copy a connected website's stored favicon to the person's own avatar.
 * The website must already have a favicon stored in object storage.
 */
export async function adoptWebsiteFaviconForPerson(
  personId: string,
  websiteId: string,
): Promise<{ imageUrl: string } | "not_found" | "no_image"> {
  const [faviconRow] = await db
    .select()
    .from(websiteFavicons)
    .where(eq(websiteFavicons.websiteId, websiteId));
  if (!faviconRow) return "no_image";

  const bytes = await getObjectBytes(faviconRow.objectKey);
  if (!bytes) return "no_image";

  const result = await setPersonImage(personId, bytes, "website-favicon");
  if (result === "not_found" || result === "bad_image") return result === "not_found" ? "not_found" : "no_image";
  return result;
}
