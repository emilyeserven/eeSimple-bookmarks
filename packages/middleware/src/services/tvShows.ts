import { asc, eq, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateTvShowInput,
  TvShow,
  UpdateTvShowInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { bookmarks, tvShows, type TvShowRow } from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing TV show name. */
export class DuplicateTvShowError extends Error {
  constructor(name: string) {
    super(`A TV show named "${name}" already exists`);
    this.name = "DuplicateTvShowError";
  }
}

/** Map a DB row to the shared `TvShow` wire type. */
function toTvShow(row: TvShowRow & { bookmarkCount?: number }): TvShow {
  return {
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName ?? null,
    slug: row.slug ?? slugify(row.name),
    sortOrder: row.sortOrder,
    mediaPropertyId: row.mediaPropertyId ?? null,
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

/** Existing TV-show slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(tvShows, tvShows.slug, tvShows.id, excludeId);

/** The Plex/media-property columns settable on create and patchable on update. */
type TvShowDataColumns = Pick<
  TvShowRow,
  "mediaPropertyId" | "plexRatingKey" | "plexItemType" | "plexItemTitle" | "year" | "romanizedName"
  | "wikidataId" | "wikipediaLinkEn" | "wikipediaLinkLocal"
>;

/** Build the settable data columns from an input, treating missing keys as "leave"/null. */
function dataFromInput(input: CreateTvShowInput | UpdateTvShowInput): Partial<TvShowDataColumns> {
  const patch: Partial<TvShowDataColumns> = {};
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

/** List all TV shows, ordered by sort order then name, each with its bookmark count. */
export async function listTvShows(): Promise<TvShow[]> {
  const rows = await db
    .select({
      id: tvShows.id,
      name: tvShows.name,
      romanizedName: tvShows.romanizedName,
      slug: tvShows.slug,
      sortOrder: tvShows.sortOrder,
      mediaPropertyId: tvShows.mediaPropertyId,
      plexRatingKey: tvShows.plexRatingKey,
      plexItemType: tvShows.plexItemType,
      plexItemTitle: tvShows.plexItemTitle,
      year: tvShows.year,
      wikidataId: tvShows.wikidataId,
      wikipediaLinkEn: tvShows.wikipediaLinkEn,
      wikipediaLinkLocal: tvShows.wikipediaLinkLocal,
      createdAt: tvShows.createdAt,
      bookmarkCount: db.$count(bookmarks, eq(bookmarks.tvShowId, tvShows.id)),
    })
    .from(tvShows)
    .orderBy(asc(tvShows.sortOrder), asc(tvShows.name));
  return rows.map(toTvShow);
}

/** Add a TV show. Throws `DuplicateTvShowError` on a name clash. */
export async function createTvShow(input: CreateTvShowInput): Promise<TvShow> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateTvShowError(input.name);

  const [clash] = await db.select({
    id: tvShows.id,
  }).from(tvShows).where(eq(tvShows.name, name));
  if (clash) throw new DuplicateTvShowError(name);

  const slug = uniqueSlug(name, await takenSlugs());
  const [row] = await db.insert(tvShows).values({
    name,
    slug,
    sortOrder: input.sortOrder ?? 0,
    ...dataFromInput(input),
  }).returning();
  return toTvShow(row);
}

/** Update a TV show (rename, reorder, re-link Plex/media property). Throws on a name clash. */
export async function updateTvShow(id: string, input: UpdateTvShowInput): Promise<TvShow | null> {
  const [existing] = await db.select().from(tvShows).where(eq(tvShows.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<TvShowRow, "name" | "slug" | "sortOrder">> & Partial<TvShowDataColumns> = {
    ...dataFromInput(input),
  };
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: tvShows.id,
    }).from(tvShows).where(eq(tvShows.name, name));
    if (clash && clash.id !== id) throw new DuplicateTvShowError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id));
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) return toTvShow(existing);

  const [row] = await db.update(tvShows).set(patch).where(eq(tvShows.id, id)).returning();
  return row ? toTvShow(row) : null;
}

/** Delete a TV show. The `set null` FK unlinks any bookmarks pointing at it. */
export async function deleteTvShow(id: string): Promise<boolean> {
  const rows = await db.delete(tvShows).where(eq(tvShows.id, id)).returning({
    id: tvShows.id,
  });
  return rows.length > 0;
}

/** Delete many TV shows, reporting per-item outcomes. */
export function bulkDeleteTvShows(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteTvShow);
}

/** Fill in slugs for any TV shows missing one (e.g. rows that predate the `slug` column). */
export async function backfillTvShowSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: tvShows.id,
      name: tvShows.name,
    })
    .from(tvShows)
    .where(isNull(tvShows.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const show of missing) {
    const slug = uniqueSlug(show.name, taken);
    taken.push(slug);
    await db.update(tvShows).set({
      slug,
    }).where(eq(tvShows.id, show.id));
  }
}
