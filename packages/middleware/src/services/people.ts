import { asc, count, eq, inArray } from "drizzle-orm";
import type { Person, BulkDeleteResult, CreatePersonInput, EntityName, LabeledWebsite, SocialLink, UpdatePersonInput } from "@eesimple/types";
import { db } from "@/db";
import { getPersonSourceLabelSettings } from "@/services/appSettings";
import { deleteGenreMoodAssignmentsForOwner } from "@/services/genreMoodAssignments";
import { deleteEntityNamesForOwner, loadEntityNames } from "@/services/entityNames";
import { deleteLanguageUsagesForOwner } from "@/services/languageUsages";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import {
  personImages,
  personGroups,
  people,
  personWebsites,
  personYoutubeChannels,
  bookmarkPeople,
  type PersonRow,
} from "@/db/schema";
import { getPersonImageRow } from "@/services/personImages";
import { extractSocialProfileLinks, fetchBodyHtmlResult } from "@/services/metadata";
import { AppError } from "@/utils/errors";
import { buildStringMap } from "@/utils/mapUtils";
import { deleteObject } from "@/utils/objectStore";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Thrown when a create/rename collides with an existing person name. */
export class DuplicatePersonError extends AppError {
  constructor(name: string) {
    super(`An person named "${name}" already exists`, "duplicateName", 409, {
      entity: "person",
      name,
    });
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

/** The Plex columns absorbed from the former Artists taxonomy (not the M2M sets). */
type PersonDataColumns = Pick<
  PersonRow,
  "plexRatingKey" | "plexItemType" | "plexItemTitle" | "year"
>;

/** Build the settable creator data columns from an update input; missing keys are left untouched. */
function creatorDataFromInput(input: UpdatePersonInput): Partial<PersonDataColumns> {
  const patch: Partial<PersonDataColumns> = {};
  if (input.plexRatingKey !== undefined) patch.plexRatingKey = input.plexRatingKey ?? null;
  if (input.plexItemType !== undefined) patch.plexItemType = input.plexItemType ?? null;
  if (input.plexItemTitle !== undefined) patch.plexItemTitle = input.plexItemTitle ?? null;
  if (input.year !== undefined) patch.year = input.year ?? null;
  return patch;
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

/** Load group IDs for a set of person IDs as a map of personId → groupId[]. */
async function loadPersonGroupMap(personIds: string[]): Promise<Map<string, string[]>> {
  if (personIds.length === 0) return new Map();
  const rows = await db
    .select({
      personId: personGroups.personId,
      groupId: personGroups.groupId,
    })
    .from(personGroups)
    .where(inArray(personGroups.personId, personIds));
  return buildStringMap(rows, r => r.personId, r => r.groupId);
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

/** Replace the full set of groups for an person (delete-then-insert). */
async function setPersonGroups(
  txOrDb: Tx | typeof db,
  personId: string,
  groupIds: string[],
): Promise<void> {
  await txOrDb.delete(personGroups).where(eq(personGroups.personId, personId));
  if (groupIds.length > 0) {
    await txOrDb.insert(personGroups).values(groupIds.map(groupId => ({
      personId,
      groupId,
    })));
  }
}

/** Map a DB row to the shared `Person` wire type. */
function toPerson(
  row: PersonRow & { avatarCreatedAt?: Date | string | null },
  bookmarkCount?: number,
  youtubeChannelIds: string[] = [],
  websiteIds: string[] = [],
  groupIds: string[] = [],
  names?: EntityName[],
): Person {
  return {
    id: row.id,
    name: row.name,
    names: names ?? [],
    slug: row.slug ?? slugify(row.name),
    description: row.description ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount,
    imageUrl: avatarUrlFrom(row.id, row.avatarCreatedAt ?? null),
    socialLinks: (row.socialLinks as SocialLink[] | null) ?? [],
    labeledWebsites: (row.labeledWebsites as LabeledWebsite[] | null) ?? [],
    youtubeChannelIds,
    websiteIds,
    groupIds,
    sortOrder: row.sortOrder,
    year: row.year ?? null,
    plexRatingKey: row.plexRatingKey ?? null,
    plexItemType: row.plexItemType ?? null,
    plexItemTitle: row.plexItemTitle ?? null,
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
      slug: people.slug,
      description: people.description,
      socialLinks: people.socialLinks,
      labeledWebsites: people.labeledWebsites,
      sortOrder: people.sortOrder,
      plexRatingKey: people.plexRatingKey,
      plexItemType: people.plexItemType,
      plexItemTitle: people.plexItemTitle,
      year: people.year,
      createdAt: people.createdAt,
      avatarCreatedAt: personImages.createdAt,
    })
    .from(people)
    .leftJoin(personImages, eq(personImages.personId, people.id))
    .orderBy(asc(people.name));

  const ids = rows.map(r => r.id);

  const [counts, channelMap, websiteMap, groupMap, namesMap] = await Promise.all([
    db
      .select({
        personId: bookmarkPeople.personId,
        count: count(),
      })
      .from(bookmarkPeople)
      .groupBy(bookmarkPeople.personId),
    loadPersonYoutubeChannelMap(ids),
    loadPersonWebsiteMap(ids),
    loadPersonGroupMap(ids),
    loadEntityNames("person", ids),
  ]);

  const countMap = new Map(counts.map(c => [c.personId, Number(c.count)]));
  return rows.map(row =>
    toPerson(
      row,
      countMap.get(row.id) ?? 0,
      channelMap.get(row.id) ?? [],
      websiteMap.get(row.id) ?? [],
      groupMap.get(row.id) ?? [],
      namesMap.get(row.id),
    ));
}

/** Whether a person row exists — a cheap check used by the image-preview route to 404 correctly. */
export async function personExists(id: string): Promise<boolean> {
  const [row] = await db
    .select({
      id: people.id,
    })
    .from(people)
    .where(eq(people.id, id));
  return row !== undefined;
}

/** Add a new person. Throws `DuplicatePersonError` on a name clash. */
export async function createPerson(input: CreatePersonInput): Promise<Person> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicatePersonError(input.name);

  const [clash] = await db.select({
    id: people.id,
  }).from(people).where(eq(people.name, name));
  if (clash) throw new DuplicatePersonError(name);

  const slug = uniqueSlug(name, await takenSlugs(), "person");
  const [row] = await db.insert(people).values({
    name,
    slug,
    description: input.description ?? null,
  }).returning();
  return toPerson(row);
}

/** Update an person's fields and/or association sets. Throws `DuplicatePersonError` on a name clash. */
export async function updatePerson(id: string, input: UpdatePersonInput): Promise<Person | null> {
  const [existing] = await db.select().from(people).where(eq(people.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<PersonRow, "name" | "slug" | "description" | "socialLinks" | "labeledWebsites" | "sortOrder">> & Partial<PersonDataColumns> = {
    ...creatorDataFromInput(input),
  };
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: people.id,
    }).from(people).where(eq(people.name, name));
    if (clash && clash.id !== id) throw new DuplicatePersonError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id), "person");
  }
  if (input.description !== undefined) patch.description = input.description ?? null;
  if ("socialLinks" in input) patch.socialLinks = input.socialLinks ?? [];
  if ("labeledWebsites" in input) patch.labeledWebsites = input.labeledWebsites ?? [];
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;

  const hasAssociationChanges
    = input.youtubeChannelIds !== undefined
      || input.websiteIds !== undefined
      || input.groupIds !== undefined;

  if (Object.keys(patch).length === 0 && !hasAssociationChanges) {
    const [imageRow, channelMap, websiteMap, groupMap] = await Promise.all([
      getPersonImageRow(id),
      loadPersonYoutubeChannelMap([id]),
      loadPersonWebsiteMap([id]),
      loadPersonGroupMap([id]),
    ]);
    return toPerson(
      {
        ...existing,
        avatarCreatedAt: imageRow?.createdAt ?? null,
      },
      undefined,
      channelMap.get(id) ?? [],
      websiteMap.get(id) ?? [],
      groupMap.get(id) ?? [],
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
    if (input.groupIds !== undefined) {
      await setPersonGroups(tx, id, input.groupIds);
    }
    const [imageRow, channelMap, websiteMap, groupMap] = await Promise.all([
      getPersonImageRow(id),
      loadPersonYoutubeChannelMap([id]),
      loadPersonWebsiteMap([id]),
      loadPersonGroupMap([id]),
    ]);
    return toPerson(
      {
        ...row,
        avatarCreatedAt: imageRow?.createdAt ?? null,
      },
      undefined,
      channelMap.get(id) ?? [],
      websiteMap.get(id) ?? [],
      groupMap.get(id) ?? [],
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
  const [[row], {
    websiteLabel,
  }] = await Promise.all([
    db
      .select({
        labeledWebsites: people.labeledWebsites,
      })
      .from(people)
      .where(eq(people.id, id)),
    getPersonSourceLabelSettings(),
  ]);

  if (!row) return "not_found";
  // Prefer the row labeled with the configured website label, else fall back to the first listed URL.
  const list = (row.labeledWebsites as LabeledWebsite[] | null) ?? [];
  const wanted = websiteLabel.trim().toLowerCase();
  const sourceUrl = list.find(w => w.label.trim().toLowerCase() === wanted)?.url ?? list[0]?.url;
  if (!sourceUrl) return "no_url";

  const result = await fetchBodyHtmlResult(sourceUrl, /<\/body>/i);
  if (result.kind !== "ok") return "fetch_error";

  return extractSocialProfileLinks(result.html, sourceUrl);
}

/** Delete an person. Bookmark join rows are removed via cascade. Returns false when not found. */
export async function deletePerson(id: string): Promise<boolean> {
  const rows = await db.delete(people).where(eq(people.id, id)).returning({
    id: people.id,
  });
  if (rows.length > 0) {
    await deleteLanguageUsagesForOwner("person", id);
    // Genre/mood assignments key off (ownerType, ownerId) with no FK on ownerId, so clean them up here.
    await deleteGenreMoodAssignmentsForOwner("person", id);
    await deleteEntityNamesForOwner("person", id);
  }
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
