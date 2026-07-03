import { asc, eq, inArray, isNull } from "drizzle-orm";
import type {
  Artist,
  BulkDeleteResult,
  CreateArtistInput,
  UpdateArtistInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { albumArtists, artists, bookmarks, type ArtistRow } from "@/db/schema";
import { buildStringMap } from "@/utils/mapUtils";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Thrown when a create/rename collides with an existing artist name. */
export class DuplicateArtistError extends Error {
  constructor(name: string) {
    super(`An artist named "${name}" already exists`);
    this.name = "DuplicateArtistError";
  }
}

/** Map a DB row to the shared `Artist` wire type. */
function toArtist(
  row: ArtistRow & { bookmarkCount?: number },
  albumIds: string[] = [],
): Artist {
  return {
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName ?? null,
    slug: row.slug ?? slugify(row.name),
    sortOrder: row.sortOrder,
    mediaPropertyId: row.mediaPropertyId ?? null,
    albumIds,
    plexRatingKey: row.plexRatingKey ?? null,
    plexItemType: row.plexItemType ?? null,
    plexItemTitle: row.plexItemTitle ?? null,
    year: row.year ?? null,
    wikidataId: row.wikidataId ?? null,
    wikipediaLinkEn: row.wikipediaLinkEn ?? null,
    wikipediaLinkLocal: row.wikipediaLinkLocal ?? null,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: row.bookmarkCount,
  };
}

/** Existing artist slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(artists, artists.slug, artists.id, excludeId);

/** The Plex/media-property columns settable on create and patchable on update (not the M2M). */
type ArtistDataColumns = Pick<
  ArtistRow,
  "mediaPropertyId" | "plexRatingKey" | "plexItemType" | "plexItemTitle" | "year" | "romanizedName"
  | "wikidataId" | "wikipediaLinkEn" | "wikipediaLinkLocal"
>;

/** Build the settable data columns from an input, treating missing keys as "leave"/null. */
function dataFromInput(input: CreateArtistInput | UpdateArtistInput): Partial<ArtistDataColumns> {
  const patch: Partial<ArtistDataColumns> = {};
  if (input.mediaPropertyId !== undefined) patch.mediaPropertyId = input.mediaPropertyId ?? null;
  if (input.plexRatingKey !== undefined) patch.plexRatingKey = input.plexRatingKey ?? null;
  if (input.plexItemType !== undefined) patch.plexItemType = input.plexItemType ?? null;
  if (input.plexItemTitle !== undefined) patch.plexItemTitle = input.plexItemTitle ?? null;
  if (input.year !== undefined) patch.year = input.year ?? null;
  if (input.romanizedName !== undefined) patch.romanizedName = input.romanizedName ?? null;
  if (input.wikidataId !== undefined) patch.wikidataId = input.wikidataId ?? null;
  if (input.wikipediaLinkEn !== undefined) patch.wikipediaLinkEn = input.wikipediaLinkEn ?? null;
  if (input.wikipediaLinkLocal !== undefined) patch.wikipediaLinkLocal = input.wikipediaLinkLocal ?? null;
  return patch;
}

/** Load album ids for a set of artist ids as a map of artistId → albumId[]. */
async function loadArtistAlbumMap(artistIds: string[]): Promise<Map<string, string[]>> {
  if (artistIds.length === 0) return new Map();
  const rows = await db
    .select({
      artistId: albumArtists.artistId,
      albumId: albumArtists.albumId,
    })
    .from(albumArtists)
    .where(inArray(albumArtists.artistId, artistIds));
  return buildStringMap(rows, r => r.artistId, r => r.albumId);
}

/** Replace the full set of albums for an artist (delete-then-insert on the shared join). */
async function setArtistAlbums(
  txOrDb: Tx | typeof db,
  artistId: string,
  albumIds: string[],
): Promise<void> {
  await txOrDb.delete(albumArtists).where(eq(albumArtists.artistId, artistId));
  if (albumIds.length > 0) {
    await txOrDb.insert(albumArtists).values(albumIds.map(albumId => ({
      albumId,
      artistId,
    })));
  }
}

/** List all artists, ordered by sort order then name, each with its bookmark count + album ids. */
export async function listArtists(): Promise<Artist[]> {
  const rows = await db
    .select({
      id: artists.id,
      name: artists.name,
      romanizedName: artists.romanizedName,
      slug: artists.slug,
      sortOrder: artists.sortOrder,
      mediaPropertyId: artists.mediaPropertyId,
      plexRatingKey: artists.plexRatingKey,
      plexItemType: artists.plexItemType,
      plexItemTitle: artists.plexItemTitle,
      year: artists.year,
      wikidataId: artists.wikidataId,
      wikipediaLinkEn: artists.wikipediaLinkEn,
      wikipediaLinkLocal: artists.wikipediaLinkLocal,
      createdAt: artists.createdAt,
      bookmarkCount: db.$count(bookmarks, eq(bookmarks.artistId, artists.id)),
    })
    .from(artists)
    .orderBy(asc(artists.sortOrder), asc(artists.name));
  const albumMap = await loadArtistAlbumMap(rows.map(r => r.id));
  return rows.map(row => toArtist(row, albumMap.get(row.id) ?? []));
}

/** Add an artist. Throws `DuplicateArtistError` on a name clash. */
export async function createArtist(input: CreateArtistInput): Promise<Artist> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateArtistError(input.name);

  const [clash] = await db.select({
    id: artists.id,
  }).from(artists).where(eq(artists.name, name));
  if (clash) throw new DuplicateArtistError(name);

  const slug = uniqueSlug(name, await takenSlugs());
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(artists).values({
      name,
      slug,
      sortOrder: input.sortOrder ?? 0,
      ...dataFromInput(input),
    }).returning();
    if (input.albumIds !== undefined) await setArtistAlbums(tx, row.id, input.albumIds);
    return toArtist(row, input.albumIds ?? []);
  });
}

/** Update an artist (rename, reorder, re-link Plex/media property, set albums). Throws on a clash. */
export async function updateArtist(id: string, input: UpdateArtistInput): Promise<Artist | null> {
  const [existing] = await db.select().from(artists).where(eq(artists.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<ArtistRow, "name" | "slug" | "sortOrder">> & Partial<ArtistDataColumns> = {
    ...dataFromInput(input),
  };
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: artists.id,
    }).from(artists).where(eq(artists.name, name));
    if (clash && clash.id !== id) throw new DuplicateArtistError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id));
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;

  return db.transaction(async (tx) => {
    const row = Object.keys(patch).length > 0
      ? (await tx.update(artists).set(patch).where(eq(artists.id, id)).returning())[0]
      : existing;
    if (input.albumIds !== undefined) await setArtistAlbums(tx, id, input.albumIds);
    const albumMap = await loadArtistAlbumMap([id]);
    return toArtist(row, albumMap.get(id) ?? []);
  });
}

/** Delete an artist. The `set null` FK unlinks bookmarks; the join rows cascade away. */
export async function deleteArtist(id: string): Promise<boolean> {
  const rows = await db.delete(artists).where(eq(artists.id, id)).returning({
    id: artists.id,
  });
  return rows.length > 0;
}

/** Delete many artists, reporting per-item outcomes. */
export function bulkDeleteArtists(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteArtist);
}

/** Fill in slugs for any artists missing one (e.g. rows that predate the `slug` column). */
export async function backfillArtistSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: artists.id,
      name: artists.name,
    })
    .from(artists)
    .where(isNull(artists.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const artist of missing) {
    const slug = uniqueSlug(artist.name, taken);
    taken.push(slug);
    await db.update(artists).set({
      slug,
    }).where(eq(artists.id, artist.id));
  }
}
