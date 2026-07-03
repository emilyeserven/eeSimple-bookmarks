import { asc, count, eq, inArray, isNull } from "drizzle-orm";
import type { Person, BulkDeleteResult, CreatePersonInput, SocialLink, UpdatePersonInput } from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import {
  personImages,
  personPublishers,
  people,
  personWebsites,
  personYoutubeChannels,
  bookmarkPeople,
  type PersonRow,
} from "@/db/schema";
import { getPersonImageRow } from "@/services/personImages";
import { extractSocialProfileLinks, fetchBodyHtmlResult } from "@/services/metadata";
import { buildStringMap } from "@/utils/mapUtils";
import { deleteObject } from "@/utils/objectStore";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Thrown when a create/rename collides with an existing person name. */
export class DuplicatePersonError extends Error {
  constructor(name: string) {
    super(`An person named "${name}" already exists`);
    this.name = "DuplicatePersonError";
  }
}

function avatarUrlFrom(personId: string, createdAt: Date | string | null): string | null {
  if (!createdAt) return null;
  const time = (createdAt instanceof Date ? createdAt : new Date(createdAt)).getTime();
  return `/api/people/${personId}/image?v=${time}`;
}

/** Load YouTube channel IDs for a set of person IDs as a map of personId → channelId[]. */
async function loadPersonYoutubeChannelMap(personIds: string[]): Promise<Map<string, string[]>> {
  if (personIds.length === 0) return new Map();
  const rows = await db
    .select({
      personId: personYoutubeChannels.personId,
      channelId: personYoutubeChannels.channelId,
    })
    .from(personYoutubeChannels)
    .where(inArray(personYoutubeChannels.personId, personIds));
  return buildStringMap(rows, r => r.personId, r => r.channelId);
}

/** Load website IDs for a set of person IDs as a map of personId → websiteId[]. */
async function loadPersonWebsiteMap(personIds: string[]): Promise<Map<string, string[]>> {
  if (personIds.length === 0) return new Map();
  const rows = await db
    .select({
      personId: personWebsites.personId,
      websiteId: personWebsites.websiteId,
    })
    .from(personWebsites)
    .where(inArray(personWebsites.personId, personIds));
  return buildStringMap(rows, r => r.personId, r => r.websiteId);
}

/** Load publisher IDs for a set of person IDs as a map of personId → publisherId[]. */
async function loadPersonPublisherMap(personIds: string[]): Promise<Map<string, string[]>> {
  if (personIds.length === 0) return new Map();
  const rows = await db
    .select({
      personId: personPublishers.personId,
      publisherId: personPublishers.publisherId,
    })
    .from(personPublishers)
    .where(inArray(personPublishers.personId, personIds));
  return buildStringMap(rows, r => r.personId, r => r.publisherId);
}

/** Replace the full set of YouTube channels for an person (delete-then-insert). */
async function setPersonYoutubeChannels(
  txOrDb: Tx | typeof db,
  personId: string,
  channelIds: string[],
): Promise<void> {
  await txOrDb.delete(personYoutubeChannels).where(eq(personYoutubeChannels.personId, personId));
  if (channelIds.length > 0) {
    await txOrDb.insert(personYoutubeChannels).values(channelIds.map(channelId => ({
      personId,
      channelId,
    })));
  }
}

/** Replace the full set of websites for an person (delete-then-insert). */
async function setPersonWebsites(
  txOrDb: Tx | typeof db,
  personId: string,
  websiteIds: string[],
): Promise<void> {
  await txOrDb.delete(personWebsites).where(eq(personWebsites.personId, personId));
  if (websiteIds.length > 0) {
    await txOrDb.insert(personWebsites).values(websiteIds.map(websiteId => ({
      personId,
      websiteId,
    })));
  }
}

/** Replace the full set of publishers for an person (delete-then-insert). */
async function setPersonPublishers(
  txOrDb: Tx | typeof db,
  personId: string,
  publisherIds: string[],
): Promise<void> {
  await txOrDb.delete(personPublishers).where(eq(personPublishers.personId, personId));
  if (publisherIds.length > 0) {
    await txOrDb.insert(personPublishers).values(publisherIds.map(publisherId => ({
      personId,
      publisherId,
    })));
  }
}

/** Map a DB row to the shared `Person` wire type. */
function toPerson(
  row: PersonRow & { avatarCreatedAt?: Date | string | null },
  bookmarkCount?: number,
  youtubeChannelIds: string[] = [],
  websiteIds: string[] = [],
  publisherIds: string[] = [],
): Person {
  return {
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName,
    slug: row.slug ?? slugify(row.name),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount,
    personWebsiteUrl: row.personWebsiteUrl ?? null,
    biographyUrl: row.biographyUrl ?? null,
    imageUrl: avatarUrlFrom(row.id, row.avatarCreatedAt ?? null),
    socialLinks: (row.socialLinks as SocialLink[] | null) ?? [],
    youtubeChannelIds,
    websiteIds,
    publisherIds,
  };
}

/** Existing person slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(people, people.slug, people.id, excludeId);

/** List all people, ordered by name, with bookmark counts and association IDs. */
export async function listPeople(): Promise<Person[]> {
  const rows = await db
    .select({
      id: people.id,
      name: people.name,
      romanizedName: people.romanizedName,
      slug: people.slug,
      personWebsiteUrl: people.personWebsiteUrl,
      biographyUrl: people.biographyUrl,
      socialLinks: people.socialLinks,
      createdAt: people.createdAt,
      avatarCreatedAt: personImages.createdAt,
    })
    .from(people)
    .leftJoin(personImages, eq(personImages.personId, people.id))
    .orderBy(asc(people.name));

  const ids = rows.map(r => r.id);

  const [counts, channelMap, websiteMap, publisherMap] = await Promise.all([
    db
      .select({
        personId: bookmarkPeople.personId,
        count: count(),
      })
      .from(bookmarkPeople)
      .groupBy(bookmarkPeople.personId),
    loadPersonYoutubeChannelMap(ids),
    loadPersonWebsiteMap(ids),
    loadPersonPublisherMap(ids),
  ]);

  const countMap = new Map(counts.map(c => [c.personId, Number(c.count)]));
  return rows.map(row =>
    toPerson(
      row,
      countMap.get(row.id) ?? 0,
      channelMap.get(row.id) ?? [],
      websiteMap.get(row.id) ?? [],
      publisherMap.get(row.id) ?? [],
    ));
}

/** Add a new person. Throws `DuplicatePersonError` on a name clash. */
export async function createPerson(input: CreatePersonInput): Promise<Person> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicatePersonError(input.name);

  const [clash] = await db.select({
    id: people.id,
  }).from(people).where(eq(people.name, name));
  if (clash) throw new DuplicatePersonError(name);

  const slug = uniqueSlug(name, await takenSlugs());
  const [row] = await db.insert(people).values({
    name,
    romanizedName: input.romanizedName ?? null,
    slug,
  }).returning();
  return toPerson(row);
}

/** Update an person's fields and/or association sets. Throws `DuplicatePersonError` on a name clash. */
export async function updatePerson(id: string, input: UpdatePersonInput): Promise<Person | null> {
  const [existing] = await db.select().from(people).where(eq(people.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<PersonRow, "name" | "romanizedName" | "slug" | "personWebsiteUrl" | "biographyUrl" | "socialLinks">> = {};
  if ("romanizedName" in input) patch.romanizedName = input.romanizedName ?? null;
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: people.id,
    }).from(people).where(eq(people.name, name));
    if (clash && clash.id !== id) throw new DuplicatePersonError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id));
  }
  if ("personWebsiteUrl" in input) patch.personWebsiteUrl = input.personWebsiteUrl ?? null;
  if ("biographyUrl" in input) patch.biographyUrl = input.biographyUrl ?? null;
  if ("socialLinks" in input) patch.socialLinks = input.socialLinks ?? [];

  const hasAssociationChanges
    = input.youtubeChannelIds !== undefined
      || input.websiteIds !== undefined
      || input.publisherIds !== undefined;

  if (Object.keys(patch).length === 0 && !hasAssociationChanges) {
    const [imageRow, channelMap, websiteMap, publisherMap] = await Promise.all([
      getPersonImageRow(id),
      loadPersonYoutubeChannelMap([id]),
      loadPersonWebsiteMap([id]),
      loadPersonPublisherMap([id]),
    ]);
    return toPerson(
      {
        ...existing,
        avatarCreatedAt: imageRow?.createdAt ?? null,
      },
      undefined,
      channelMap.get(id) ?? [],
      websiteMap.get(id) ?? [],
      publisherMap.get(id) ?? [],
    );
  }

  return db.transaction(async (tx) => {
    let row = existing;
    if (Object.keys(patch).length > 0) {
      const [updated] = await tx.update(people).set(patch).where(eq(people.id, id)).returning();
      if (!updated) return null;
      row = updated;
    }
    if (input.youtubeChannelIds !== undefined) {
      await setPersonYoutubeChannels(tx, id, input.youtubeChannelIds);
    }
    if (input.websiteIds !== undefined) {
      await setPersonWebsites(tx, id, input.websiteIds);
    }
    if (input.publisherIds !== undefined) {
      await setPersonPublishers(tx, id, input.publisherIds);
    }
    const [imageRow, channelMap, websiteMap, publisherMap] = await Promise.all([
      getPersonImageRow(id),
      loadPersonYoutubeChannelMap([id]),
      loadPersonWebsiteMap([id]),
      loadPersonPublisherMap([id]),
    ]);
    return toPerson(
      {
        ...row,
        avatarCreatedAt: imageRow?.createdAt ?? null,
      },
      undefined,
      channelMap.get(id) ?? [],
      websiteMap.get(id) ?? [],
      publisherMap.get(id) ?? [],
    );
  });
}

/**
 * Fetch the person's website and scan it for GitHub, Goodreads, and Bluesky profile links. Returns
 * the detected links, or a typed reason detection couldn't proceed.
 */
export async function detectPersonSocialLinksFromWebsite(
  id: string,
): Promise<SocialLink[] | "not_found" | "no_url" | "fetch_error"> {
  const [row] = await db
    .select({
      personWebsiteUrl: people.personWebsiteUrl,
    })
    .from(people)
    .where(eq(people.id, id));

  if (!row) return "not_found";
  if (!row.personWebsiteUrl) return "no_url";

  const result = await fetchBodyHtmlResult(row.personWebsiteUrl, /<\/body>/i);
  if (result.kind !== "ok") return "fetch_error";

  return extractSocialProfileLinks(result.html, row.personWebsiteUrl);
}

/** Delete an person. Bookmark join rows are removed via cascade. Returns false when not found. */
export async function deletePerson(id: string): Promise<boolean> {
  const rows = await db.delete(people).where(eq(people.id, id)).returning({
    id: people.id,
  });
  return rows.length > 0;
}

/**
 * Bulk delete people, reporting per-item outcomes without aborting the batch. Each person's stored
 * avatar object is removed after a successful delete, matching the single-delete route's cleanup.
 */
export async function bulkDeletePeople(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, async (id) => {
    // Look up the avatar's object key before the delete cascades the image row away.
    const imageRow = await getPersonImageRow(id);
    const deleted = await deletePerson(id);
    if (deleted && imageRow) await deleteObject(imageRow.objectKey).catch(() => undefined);
    return deleted;
  });
}

/** Fill in slugs for any people missing one (e.g. rows that predate the `slug` column). */
export async function backfillPersonSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: people.id,
      name: people.name,
    })
    .from(people)
    .where(isNull(people.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const person of missing) {
    const slug = uniqueSlug(person.name, taken);
    taken.push(slug);
    await db.update(people).set({
      slug,
    }).where(eq(people.id, person.id));
  }
}
