import { asc, eq, getTableColumns, isNull } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type {
  BulkDeleteResult,
  LanguageUsageOwnerType,
  TaxonomyImageOwnerType,
} from "@eesimple/types";
import { db } from "@/db";
import { deleteLanguageUsagesForOwner } from "@/services/languageUsages";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { deleteTaxonomyImagesForOwner } from "@/services/taxonomyImages";
import { bookmarks, movies } from "@/db/schema";
import { uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/**
 * A concrete representative Plex-taxonomy table type. drizzle's query builders resolve a conditional
 * over the *concrete* table's column set, which a `TTable` type parameter can't satisfy, so every
 * drizzle call inside the factory runs against the real table object narrowed to this representative
 * type (all five tables share the shape the factory touches). `movies` is used only for its type here
 * — schema.ts imports no service, so this is not a circular import.
 */
type RepresentativePlexTable = typeof movies;

/**
 * Shared implementation for the five Plex-backed media taxonomy services — Movies, TV Shows,
 * Episodes, Tracks (via {@link createPlexTaxonomyService}) and Albums (which keeps a custom
 * create/update for its People/Group credit M2M but mirrors the same wire shape). Each was the same
 * file rewritten per table; the factory parameterizes over the table, the `bookmarks.<x>Id` FK, the
 * owner-type cleanup tags, the per-entity `Duplicate*Error`, and the row→wire mapper.
 */

/** The columns every Plex media taxonomy table shares (plus optional per-entity parent FKs). */
type PlexTaxonomyTable = PgTable & {
  id: PgColumn;
  name: PgColumn;
  slug: PgColumn;
  sortOrder: PgColumn;
};

/** The Plex/media-property columns settable on create and patchable on update (shared by all five). */
export interface PlexTaxonomyCreateInput {
  name: string;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
  year?: number | null;
  romanizedName?: string | null;
  wikidataId?: string | null;
  wikipediaLinkEn?: string | null;
  wikipediaLinkLocal?: string | null;
}

/** The update input — every field optional (name included). */
export type PlexTaxonomyUpdateInput = Partial<PlexTaxonomyCreateInput>;

/**
 * Build the settable common data columns from an input, treating missing keys as "leave"/null.
 * Extra per-entity columns (episodes' `tvShowId`, tracks' `albumId`) come from
 * {@link PlexTaxonomyServiceConfig.extraDataFromInput}.
 */
export function buildPlexTaxonomyData(
  input: PlexTaxonomyCreateInput | PlexTaxonomyUpdateInput,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
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

/** Configuration for one Plex media taxonomy service. */
export interface PlexTaxonomyServiceConfig<TTable extends PlexTaxonomyTable, T, C, U> {
  /** The drizzle table (e.g. `movies`). */
  table: TTable;
  /** The `bookmarks.<x>Id` FK column, for the per-row bookmark count. */
  bookmarkFk: PgColumn;
  /** Owner-type tag for taxonomy-image cleanup on delete. */
  taxonomyImageOwnerType: TaxonomyImageOwnerType;
  /** Owner-type tag for language-usage cleanup on delete (movies/tvShows only; omit otherwise). */
  languageUsageOwnerType?: LanguageUsageOwnerType;
  /** Build the entity's distinct `Duplicate*Error` (kept per-entity so routes can `instanceof`). */
  makeDuplicateError: (name: string) => Error;
  /** Map a DB row (+ optional `bookmarkCount`) to the shared wire type. */
  toWire: (row: TTable["$inferSelect"] & { bookmarkCount?: number }) => T;
  /** Extra settable columns beyond the shared Plex set (episodes' `tvShowId`, tracks' `albumId`). */
  extraDataFromInput?: (input: C | U) => Record<string, unknown>;
}

/** The CRUD surface a Plex media taxonomy service exposes (re-exported under per-entity names). */
export interface PlexTaxonomyService<T, C, U> {
  list: () => Promise<T[]>;
  create: (input: C) => Promise<T>;
  update: (id: string, input: U) => Promise<T | null>;
  delete: (id: string) => Promise<boolean>;
  bulkDelete: (ids: string[]) => Promise<BulkDeleteResult[]>;
  backfillSlugs: () => Promise<void>;
}

/**
 * Create a Plex media taxonomy service. The returned functions carry the exact behavior the
 * per-table files had — slug generation via `takenSlugsOf`/`uniqueSlug`, sort ordering, the
 * `set null` bookmark-FK unlink on delete, and language-usage + taxonomy-image cleanup.
 */
export function createPlexTaxonomyService<
  TTable extends PlexTaxonomyTable,
  T,
  C extends PlexTaxonomyCreateInput,
  U extends PlexTaxonomyUpdateInput,
>(config: PlexTaxonomyServiceConfig<TTable, T, C, U>): PlexTaxonomyService<T, C, U> {
  const {
    bookmarkFk, taxonomyImageOwnerType, languageUsageOwnerType, makeDuplicateError,
  } = config;
  // The real table object, narrowed to the concrete representative type so drizzle's builders
  // resolve (see `RepresentativePlexTable`). Rows read back are narrowed to the caller's row type.
  const table = config.table as unknown as RepresentativePlexTable;
  const toWire = config.toWire as (row: RepresentativePlexTable["$inferSelect"] & { bookmarkCount?: number }) => T;

  /** Existing slugs, optionally excluding one row (when renaming). */
  const takenSlugs = (excludeId?: string) =>
    takenSlugsOf(table, table.slug, table.id, excludeId);

  /** The full settable data columns (shared + per-entity extras) from an input. */
  const dataFromInput = (input: C | U): Record<string, unknown> => ({
    ...buildPlexTaxonomyData(input),
    ...config.extraDataFromInput?.(input),
  });

  async function list(): Promise<T[]> {
    const rows = await db
      .select({
        ...getTableColumns(table),
        bookmarkCount: db.$count(bookmarks, eq(bookmarkFk, table.id)),
      })
      .from(table)
      .orderBy(asc(table.sortOrder), asc(table.name));
    return rows.map(toWire);
  }

  async function create(input: C): Promise<T> {
    const name = input.name.trim();
    if (name.length === 0) throw makeDuplicateError(input.name);

    const [clash] = await db.select({
      id: table.id,
    }).from(table).where(eq(table.name, name));
    if (clash) throw makeDuplicateError(name);

    const slug = uniqueSlug(name, await takenSlugs());
    const values: RepresentativePlexTable["$inferInsert"] = {
      name,
      slug,
      sortOrder: input.sortOrder ?? 0,
      ...dataFromInput(input),
    };
    const [row] = await db.insert(table).values(values).returning();
    return toWire(row);
  }

  async function update(id: string, input: U): Promise<T | null> {
    const [existing] = await db.select().from(table).where(eq(table.id, id));
    if (!existing) return null;

    const patch: Record<string, unknown> = {
      ...dataFromInput(input),
    };
    if (input.name !== undefined && input.name.trim() !== existing.name) {
      const name = input.name.trim();
      const [clash] = await db.select({
        id: table.id,
      }).from(table).where(eq(table.name, name));
      if (clash && clash.id !== id) throw makeDuplicateError(name);
      patch.name = name;
      patch.slug = uniqueSlug(name, await takenSlugs(id));
    }
    if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
    if (Object.keys(patch).length === 0) return toWire(existing);

    const [row] = await db.update(table).set(patch).where(eq(table.id, id)).returning();
    return row ? toWire(row) : null;
  }

  async function remove(id: string): Promise<boolean> {
    const rows = await db.delete(table).where(eq(table.id, id)).returning({
      id: table.id,
    });
    if (rows.length > 0) {
      if (languageUsageOwnerType) await deleteLanguageUsagesForOwner(languageUsageOwnerType, id);
      await deleteTaxonomyImagesForOwner(taxonomyImageOwnerType, id);
    }
    return rows.length > 0;
  }

  function bulkDelete(ids: string[]): Promise<BulkDeleteResult[]> {
    return bulkDeleteEntities(ids, remove);
  }

  async function backfillSlugs(): Promise<void> {
    const missing = await db
      .select({
        id: table.id,
        name: table.name,
      })
      .from(table)
      .where(isNull(table.slug));
    if (missing.length === 0) return;

    const taken = await takenSlugs();
    for (const entity of missing) {
      const slug = uniqueSlug(entity.name, taken);
      taken.push(slug);
      await db.update(table).set({
        slug,
      }).where(eq(table.id, entity.id));
    }
  }

  return {
    list,
    create,
    update,
    delete: remove,
    bulkDelete,
    backfillSlugs,
  };
}
