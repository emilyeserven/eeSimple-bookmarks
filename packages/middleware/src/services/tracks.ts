import { asc, eq, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateTrackInput,
  Track,
  UpdateTrackInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { deleteTaxonomyImagesForOwner } from "@/services/taxonomyImages";
import { bookmarks, tracks, type TrackRow } from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing track name. */
export class DuplicateTrackError extends Error {
  constructor(name: string) {
    super(`A track named "${name}" already exists`);
    this.name = "DuplicateTrackError";
  }
}

/** Map a DB row to the shared `Track` wire type. */
function toTrack(row: TrackRow & { bookmarkCount?: number }): Track {
  return {
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName ?? null,
    slug: row.slug ?? slugify(row.name),
    sortOrder: row.sortOrder,
    mediaPropertyId: row.mediaPropertyId ?? null,
    albumId: row.albumId ?? null,
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

/** Existing track slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(tracks, tracks.slug, tracks.id, excludeId);

/** The Plex/media-property/parent columns settable on create and patchable on update. */
type TrackDataColumns = Pick<
  TrackRow,
  "mediaPropertyId" | "albumId" | "plexRatingKey" | "plexItemType" | "plexItemTitle" | "year" | "romanizedName"
  | "wikidataId" | "wikipediaLinkEn" | "wikipediaLinkLocal"
>;

/** Build the settable data columns from an input, treating missing keys as "leave"/null. */
function dataFromInput(input: CreateTrackInput | UpdateTrackInput): Partial<TrackDataColumns> {
  const patch: Partial<TrackDataColumns> = {};
  if (input.mediaPropertyId !== undefined) patch.mediaPropertyId = input.mediaPropertyId ?? null;
  if (input.albumId !== undefined) patch.albumId = input.albumId ?? null;
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

/** List all tracks, ordered by sort order then name, each with its bookmark count. */
export async function listTracks(): Promise<Track[]> {
  const rows = await db
    .select({
      id: tracks.id,
      name: tracks.name,
      romanizedName: tracks.romanizedName,
      slug: tracks.slug,
      sortOrder: tracks.sortOrder,
      mediaPropertyId: tracks.mediaPropertyId,
      albumId: tracks.albumId,
      plexRatingKey: tracks.plexRatingKey,
      plexItemType: tracks.plexItemType,
      plexItemTitle: tracks.plexItemTitle,
      year: tracks.year,
      wikidataId: tracks.wikidataId,
      wikipediaLinkEn: tracks.wikipediaLinkEn,
      wikipediaLinkLocal: tracks.wikipediaLinkLocal,
      createdAt: tracks.createdAt,
      bookmarkCount: db.$count(bookmarks, eq(bookmarks.trackId, tracks.id)),
    })
    .from(tracks)
    .orderBy(asc(tracks.sortOrder), asc(tracks.name));
  return rows.map(toTrack);
}

/** Add a track. Throws `DuplicateTrackError` on a name clash. */
export async function createTrack(input: CreateTrackInput): Promise<Track> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateTrackError(input.name);

  const [clash] = await db.select({
    id: tracks.id,
  }).from(tracks).where(eq(tracks.name, name));
  if (clash) throw new DuplicateTrackError(name);

  const slug = uniqueSlug(name, await takenSlugs());
  const [row] = await db.insert(tracks).values({
    name,
    slug,
    sortOrder: input.sortOrder ?? 0,
    ...dataFromInput(input),
  }).returning();
  return toTrack(row);
}

/** Update a track (rename, reorder, re-link Plex/media property/parent). Throws on a name clash. */
export async function updateTrack(id: string, input: UpdateTrackInput): Promise<Track | null> {
  const [existing] = await db.select().from(tracks).where(eq(tracks.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<TrackRow, "name" | "slug" | "sortOrder">> & Partial<TrackDataColumns> = {
    ...dataFromInput(input),
  };
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: tracks.id,
    }).from(tracks).where(eq(tracks.name, name));
    if (clash && clash.id !== id) throw new DuplicateTrackError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id));
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) return toTrack(existing);

  const [row] = await db.update(tracks).set(patch).where(eq(tracks.id, id)).returning();
  return row ? toTrack(row) : null;
}

/** Delete a track. The `set null` FK unlinks any bookmarks pointing at it. */
export async function deleteTrack(id: string): Promise<boolean> {
  const rows = await db.delete(tracks).where(eq(tracks.id, id)).returning({
    id: tracks.id,
  });
  if (rows.length > 0) await deleteTaxonomyImagesForOwner("track", id);
  return rows.length > 0;
}

/** Delete many tracks, reporting per-item outcomes. */
export function bulkDeleteTracks(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteTrack);
}

/** Fill in slugs for any tracks missing one (e.g. rows that predate the `slug` column). */
export async function backfillTrackSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: tracks.id,
      name: tracks.name,
    })
    .from(tracks)
    .where(isNull(tracks.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const track of missing) {
    const slug = uniqueSlug(track.name, taken);
    taken.push(slug);
    await db.update(tracks).set({
      slug,
    }).where(eq(tracks.id, track.id));
  }
}
