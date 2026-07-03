import { asc, eq, inArray, isNull } from "drizzle-orm";
import type {
  Album,
  BulkDeleteResult,
  CreateAlbumInput,
  UpdateAlbumInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { albumArtists, albums, bookmarks, type AlbumRow } from "@/db/schema";
import { buildStringMap } from "@/utils/mapUtils";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Thrown when a create/rename collides with an existing album name. */
export class DuplicateAlbumError extends Error {
  constructor(name: string) {
    super(`An album named "${name}" already exists`);
    this.name = "DuplicateAlbumError";
  }
}

/** Map a DB row to the shared `Album` wire type. */
function toAlbum(
  row: AlbumRow & { bookmarkCount?: number },
  artistIds: string[] = [],
): Album {
  return {
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName ?? null,
    slug: row.slug ?? slugify(row.name),
    sortOrder: row.sortOrder,
    mediaPropertyId: row.mediaPropertyId ?? null,
    artistIds,
    plexRatingKey: row.plexRatingKey ?? null,
    plexItemType: row.plexItemType ?? null,
    plexItemTitle: row.plexItemTitle ?? null,
    year: row.year ?? null,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: row.bookmarkCount,
  };
}

/** Existing album slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(albums, albums.slug, albums.id, excludeId);

/** The Plex/media-property columns settable on create and patchable on update (not the M2M). */
type AlbumDataColumns = Pick<
  AlbumRow,
  "mediaPropertyId" | "plexRatingKey" | "plexItemType" | "plexItemTitle" | "year" | "romanizedName"
>;

/** Build the settable data columns from an input, treating missing keys as "leave"/null. */
function dataFromInput(input: CreateAlbumInput | UpdateAlbumInput): Partial<AlbumDataColumns> {
  const patch: Partial<AlbumDataColumns> = {};
  if (input.mediaPropertyId !== undefined) patch.mediaPropertyId = input.mediaPropertyId ?? null;
  if (input.plexRatingKey !== undefined) patch.plexRatingKey = input.plexRatingKey ?? null;
  if (input.plexItemType !== undefined) patch.plexItemType = input.plexItemType ?? null;
  if (input.plexItemTitle !== undefined) patch.plexItemTitle = input.plexItemTitle ?? null;
  if (input.year !== undefined) patch.year = input.year ?? null;
  if (input.romanizedName !== undefined) patch.romanizedName = input.romanizedName ?? null;
  return patch;
}

/** Load artist ids for a set of album ids as a map of albumId → artistId[]. */
async function loadAlbumArtistMap(albumIds: string[]): Promise<Map<string, string[]>> {
  if (albumIds.length === 0) return new Map();
  const rows = await db
    .select({
      albumId: albumArtists.albumId,
      artistId: albumArtists.artistId,
    })
    .from(albumArtists)
    .where(inArray(albumArtists.albumId, albumIds));
  return buildStringMap(rows, r => r.albumId, r => r.artistId);
}

/** Replace the full set of artists for an album (delete-then-insert). */
export async function setAlbumArtists(
  txOrDb: Tx | typeof db,
  albumId: string,
  artistIds: string[],
): Promise<void> {
  await txOrDb.delete(albumArtists).where(eq(albumArtists.albumId, albumId));
  if (artistIds.length > 0) {
    await txOrDb.insert(albumArtists).values(artistIds.map(artistId => ({
      albumId,
      artistId,
    })));
  }
}

/** List all albums, ordered by sort order then name, each with its bookmark count + artist ids. */
export async function listAlbums(): Promise<Album[]> {
  const rows = await db
    .select({
      id: albums.id,
      name: albums.name,
      romanizedName: albums.romanizedName,
      slug: albums.slug,
      sortOrder: albums.sortOrder,
      mediaPropertyId: albums.mediaPropertyId,
      plexRatingKey: albums.plexRatingKey,
      plexItemType: albums.plexItemType,
      plexItemTitle: albums.plexItemTitle,
      year: albums.year,
      createdAt: albums.createdAt,
      bookmarkCount: db.$count(bookmarks, eq(bookmarks.albumId, albums.id)),
    })
    .from(albums)
    .orderBy(asc(albums.sortOrder), asc(albums.name));
  const artistMap = await loadAlbumArtistMap(rows.map(r => r.id));
  return rows.map(row => toAlbum(row, artistMap.get(row.id) ?? []));
}

/** Add an album. Throws `DuplicateAlbumError` on a name clash. */
export async function createAlbum(input: CreateAlbumInput): Promise<Album> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateAlbumError(input.name);

  const [clash] = await db.select({
    id: albums.id,
  }).from(albums).where(eq(albums.name, name));
  if (clash) throw new DuplicateAlbumError(name);

  const slug = uniqueSlug(name, await takenSlugs());
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(albums).values({
      name,
      slug,
      sortOrder: input.sortOrder ?? 0,
      ...dataFromInput(input),
    }).returning();
    if (input.artistIds !== undefined) await setAlbumArtists(tx, row.id, input.artistIds);
    return toAlbum(row, input.artistIds ?? []);
  });
}

/** Update an album (rename, reorder, re-link Plex/media property, set artists). Throws on a clash. */
export async function updateAlbum(id: string, input: UpdateAlbumInput): Promise<Album | null> {
  const [existing] = await db.select().from(albums).where(eq(albums.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<AlbumRow, "name" | "slug" | "sortOrder">> & Partial<AlbumDataColumns> = {
    ...dataFromInput(input),
  };
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: albums.id,
    }).from(albums).where(eq(albums.name, name));
    if (clash && clash.id !== id) throw new DuplicateAlbumError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id));
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;

  return db.transaction(async (tx) => {
    const row = Object.keys(patch).length > 0
      ? (await tx.update(albums).set(patch).where(eq(albums.id, id)).returning())[0]
      : existing;
    if (input.artistIds !== undefined) await setAlbumArtists(tx, id, input.artistIds);
    const artistMap = await loadAlbumArtistMap([id]);
    return toAlbum(row, artistMap.get(id) ?? []);
  });
}

/** Delete an album. The `set null` FK unlinks bookmarks; the join rows cascade away. */
export async function deleteAlbum(id: string): Promise<boolean> {
  const rows = await db.delete(albums).where(eq(albums.id, id)).returning({
    id: albums.id,
  });
  return rows.length > 0;
}

/** Delete many albums, reporting per-item outcomes. */
export function bulkDeleteAlbums(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteAlbum);
}

/** Fill in slugs for any albums missing one (e.g. rows that predate the `slug` column). */
export async function backfillAlbumSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: albums.id,
      name: albums.name,
    })
    .from(albums)
    .where(isNull(albums.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const album of missing) {
    const slug = uniqueSlug(album.name, taken);
    taken.push(slug);
    await db.update(albums).set({
      slug,
    }).where(eq(albums.id, album.id));
  }
}
