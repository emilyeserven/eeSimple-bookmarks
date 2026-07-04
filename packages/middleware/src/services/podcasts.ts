import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreatePodcastInput,
  Podcast,
  PodcastLinkProvider,
  UpdatePodcastInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { deleteTaxonomyImagesForOwner } from "@/services/taxonomyImages";
import { deleteEntityNamesForOwner } from "@/services/entityNames";
import { bookmarks, podcastGroups, podcastPeople, podcasts, taxonomyImages, type PodcastRow } from "@/db/schema";
import { buildStringMap } from "@/utils/mapUtils";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Thrown when a create/rename collides with an existing podcast name. */
export class DuplicatePodcastError extends Error {
  constructor(name: string) {
    super(`A podcast named "${name}" already exists`);
    this.name = "DuplicatePodcastError";
  }
}

/** Build the same versioned URL `taxonomyImageFromRow` produces, from just the id/createdAt. */
function mainImageUrl(image: { id: string;
  createdAt: Date | string; } | null): string | null {
  if (!image) return null;
  const created = image.createdAt instanceof Date ? image.createdAt : new Date(image.createdAt);
  return `/api/taxonomy-images/${image.id}?v=${created.getTime()}`;
}

/** Map a DB row to the shared `Podcast` wire type. */
function toPodcast(
  row: PodcastRow & {
    bookmarkCount?: number;
    mainImage?: { id: string;
      createdAt: Date | string; } | null;
  },
  personIds: string[] = [],
  groupIds: string[] = [],
): Podcast {
  return {
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName ?? null,
    slug: row.slug ?? slugify(row.name),
    sortOrder: row.sortOrder,
    mediaPropertyId: row.mediaPropertyId ?? null,
    feedUrl: row.feedUrl ?? null,
    itunesId: row.itunesId ?? null,
    itunesUrl: row.itunesUrl ?? null,
    spotifyUrl: row.spotifyUrl ?? null,
    pocketCastsUuid: row.pocketCastsUuid ?? null,
    pocketCastsUrl: row.pocketCastsUrl ?? null,
    defaultLinkProvider: (row.defaultLinkProvider as PodcastLinkProvider | null) ?? null,
    personIds,
    groupIds,
    description: row.description ?? null,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: row.bookmarkCount,
    imageUrl: mainImageUrl(row.mainImage ?? null),
  };
}

/** Existing podcast slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(podcasts, podcasts.slug, podcasts.id, excludeId);

/** The source/media-property columns settable on create and patchable on update (not the M2M). */
type PodcastDataColumns = Pick<
  PodcastRow,
  | "mediaPropertyId" | "feedUrl" | "itunesId" | "itunesUrl" | "spotifyUrl" | "pocketCastsUuid"
  | "pocketCastsUrl" | "defaultLinkProvider" | "description" | "romanizedName"
>;

/** Build the settable data columns from an input, treating missing keys as "leave"/null. */
function dataFromInput(input: CreatePodcastInput | UpdatePodcastInput): Partial<PodcastDataColumns> {
  const patch: Partial<PodcastDataColumns> = {};
  if (input.mediaPropertyId !== undefined) patch.mediaPropertyId = input.mediaPropertyId ?? null;
  if (input.feedUrl !== undefined) patch.feedUrl = input.feedUrl ?? null;
  if (input.itunesId !== undefined) patch.itunesId = input.itunesId ?? null;
  if (input.itunesUrl !== undefined) patch.itunesUrl = input.itunesUrl ?? null;
  if (input.spotifyUrl !== undefined) patch.spotifyUrl = input.spotifyUrl ?? null;
  if (input.pocketCastsUuid !== undefined) patch.pocketCastsUuid = input.pocketCastsUuid ?? null;
  if (input.pocketCastsUrl !== undefined) patch.pocketCastsUrl = input.pocketCastsUrl ?? null;
  if (input.defaultLinkProvider !== undefined) patch.defaultLinkProvider = input.defaultLinkProvider ?? null;
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.romanizedName !== undefined) patch.romanizedName = input.romanizedName ?? null;
  return patch;
}

/** Load person ids (author credits) for a set of podcast ids as a map of podcastId → personId[]. */
async function loadPodcastPersonMap(
  podcastIds: string[],
  txOrDb: Tx | typeof db = db,
): Promise<Map<string, string[]>> {
  if (podcastIds.length === 0) return new Map();
  const rows = await txOrDb
    .select({
      podcastId: podcastPeople.podcastId,
      personId: podcastPeople.personId,
    })
    .from(podcastPeople)
    .where(inArray(podcastPeople.podcastId, podcastIds));
  return buildStringMap(rows, r => r.podcastId, r => r.personId);
}

/** Load group ids (author credits) for a set of podcast ids as a map of podcastId → groupId[]. */
async function loadPodcastGroupMap(
  podcastIds: string[],
  txOrDb: Tx | typeof db = db,
): Promise<Map<string, string[]>> {
  if (podcastIds.length === 0) return new Map();
  const rows = await txOrDb
    .select({
      podcastId: podcastGroups.podcastId,
      groupId: podcastGroups.groupId,
    })
    .from(podcastGroups)
    .where(inArray(podcastGroups.podcastId, podcastIds));
  return buildStringMap(rows, r => r.podcastId, r => r.groupId);
}

/** Replace the full set of People author credits for a podcast (delete-then-insert). */
export async function setPodcastPeople(
  txOrDb: Tx | typeof db,
  podcastId: string,
  personIds: string[],
): Promise<void> {
  await txOrDb.delete(podcastPeople).where(eq(podcastPeople.podcastId, podcastId));
  if (personIds.length > 0) {
    await txOrDb.insert(podcastPeople).values(personIds.map(personId => ({
      podcastId,
      personId,
    })));
  }
}

/** Replace the full set of Group author credits for a podcast (delete-then-insert). */
export async function setPodcastGroups(
  txOrDb: Tx | typeof db,
  podcastId: string,
  groupIds: string[],
): Promise<void> {
  await txOrDb.delete(podcastGroups).where(eq(podcastGroups.podcastId, podcastId));
  if (groupIds.length > 0) {
    await txOrDb.insert(podcastGroups).values(groupIds.map(groupId => ({
      podcastId,
      groupId,
    })));
  }
}

/** List all podcasts, ordered by sort order then name, each with its bookmark count + author credits. */
export async function listPodcasts(): Promise<Podcast[]> {
  const rows = await db
    .select({
      id: podcasts.id,
      name: podcasts.name,
      romanizedName: podcasts.romanizedName,
      slug: podcasts.slug,
      sortOrder: podcasts.sortOrder,
      mediaPropertyId: podcasts.mediaPropertyId,
      feedUrl: podcasts.feedUrl,
      itunesId: podcasts.itunesId,
      itunesUrl: podcasts.itunesUrl,
      spotifyUrl: podcasts.spotifyUrl,
      pocketCastsUuid: podcasts.pocketCastsUuid,
      pocketCastsUrl: podcasts.pocketCastsUrl,
      defaultLinkProvider: podcasts.defaultLinkProvider,
      description: podcasts.description,
      createdAt: podcasts.createdAt,
      bookmarkCount: db.$count(bookmarks, eq(bookmarks.podcastId, podcasts.id)),
      mainImage: {
        id: taxonomyImages.id,
        createdAt: taxonomyImages.createdAt,
      },
    })
    .from(podcasts)
    .leftJoin(
      taxonomyImages,
      and(
        eq(taxonomyImages.ownerType, "podcast"),
        eq(taxonomyImages.ownerId, podcasts.id),
        eq(taxonomyImages.isMain, true),
      ),
    )
    .orderBy(asc(podcasts.sortOrder), asc(podcasts.name));
  const ids = rows.map(r => r.id);
  const [personMap, groupMap] = await Promise.all([
    loadPodcastPersonMap(ids),
    loadPodcastGroupMap(ids),
  ]);
  return rows.map(row => toPodcast(
    {
      ...row,
      mainImage: row.mainImage?.id ? row.mainImage : null,
    },
    personMap.get(row.id) ?? [],
    groupMap.get(row.id) ?? [],
  ));
}

/** Fetch a single podcast by id, or `null` when it doesn't exist. */
export async function getPodcast(id: string): Promise<Podcast | null> {
  const [row] = await db.select().from(podcasts).where(eq(podcasts.id, id));
  return row ? toPodcast(row) : null;
}

/** Add a podcast. Throws `DuplicatePodcastError` on a name clash. */
export async function createPodcast(input: CreatePodcastInput): Promise<Podcast> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicatePodcastError(input.name);

  const [clash] = await db.select({
    id: podcasts.id,
  }).from(podcasts).where(eq(podcasts.name, name));
  if (clash) throw new DuplicatePodcastError(name);

  const slug = uniqueSlug(name, await takenSlugs(), "podcast");
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(podcasts).values({
      name,
      slug,
      sortOrder: input.sortOrder ?? 0,
      ...dataFromInput(input),
    }).returning();
    if (input.personIds !== undefined) await setPodcastPeople(tx, row.id, input.personIds);
    if (input.groupIds !== undefined) await setPodcastGroups(tx, row.id, input.groupIds);
    return toPodcast(row, input.personIds ?? [], input.groupIds ?? []);
  });
}

/** Update a podcast (rename, reorder, re-link feed/iTunes/media property, set credits). Throws on a clash. */
export async function updatePodcast(id: string, input: UpdatePodcastInput): Promise<Podcast | null> {
  const [existing] = await db.select().from(podcasts).where(eq(podcasts.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<PodcastRow, "name" | "slug" | "sortOrder">> & Partial<PodcastDataColumns> = {
    ...dataFromInput(input),
  };
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: podcasts.id,
    }).from(podcasts).where(eq(podcasts.name, name));
    if (clash && clash.id !== id) throw new DuplicatePodcastError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id), "podcast");
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;

  return db.transaction(async (tx) => {
    const row = Object.keys(patch).length > 0
      ? (await tx.update(podcasts).set(patch).where(eq(podcasts.id, id)).returning())[0]
      : existing;
    if (input.personIds !== undefined) await setPodcastPeople(tx, id, input.personIds);
    if (input.groupIds !== undefined) await setPodcastGroups(tx, id, input.groupIds);
    const [personMap, groupMap] = await Promise.all([
      loadPodcastPersonMap([id], tx),
      loadPodcastGroupMap([id], tx),
    ]);
    return toPodcast(row, personMap.get(id) ?? [], groupMap.get(id) ?? []);
  });
}

/** Delete a podcast. The `set null` FK unlinks any bookmarks pointing at it. */
export async function deletePodcast(id: string): Promise<boolean> {
  const rows = await db.delete(podcasts).where(eq(podcasts.id, id)).returning({
    id: podcasts.id,
  });
  if (rows.length > 0) {
    await deleteTaxonomyImagesForOwner("podcast", id);
    await deleteEntityNamesForOwner("podcast", id);
  }
  return rows.length > 0;
}

/** Delete many podcasts, reporting per-item outcomes. */
export function bulkDeletePodcasts(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deletePodcast);
}

/** Fill in slugs for any podcasts missing one (e.g. rows that predate the `slug` column). */
export async function backfillPodcastSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: podcasts.id,
      name: podcasts.name,
    })
    .from(podcasts)
    .where(isNull(podcasts.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const podcast of missing) {
    const slug = uniqueSlug(podcast.name, taken, "podcast");
    taken.push(slug);
    await db.update(podcasts).set({
      slug,
    }).where(eq(podcasts.id, podcast.id));
  }
}
