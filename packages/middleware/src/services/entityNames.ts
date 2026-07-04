import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { EntityName, EntityNameOwnerType, UpdateEntityNameEntry } from "@eesimple/types";
import { db } from "@/db";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import {
  albums,
  books,
  bookmarks,
  categories,
  entityNames,
  episodes,
  genreMoods,
  groups,
  languages,
  locations,
  mediaTypes,
  movies,
  people,
  podcasts,
  tags,
  tracks,
  tvShows,
} from "@/db/schema";

/**
 * Where each owner type keeps its denormalized base name/title. The `isPrimary` `entity_names` row is
 * kept in sync with this column so every existing query/sort/hydration keeps working untouched. The
 * physical column name (`title` for bookmarks, `name` for everything else) drives the generic sync
 * `UPDATE`; the table object renders as its quoted name. Exhaustive over `EntityNameOwnerType` — a
 * new owner fails `tsc` until listed here.
 */
const OWNER_TABLES: Record<EntityNameOwnerType, { table: PgTable;
  nameColumn: string; }> = {
  bookmark: {
    table: bookmarks,
    nameColumn: "title",
  },
  category: {
    table: categories,
    nameColumn: "name",
  },
  tag: {
    table: tags,
    nameColumn: "name",
  },
  mediaType: {
    table: mediaTypes,
    nameColumn: "name",
  },
  genreMood: {
    table: genreMoods,
    nameColumn: "name",
  },
  location: {
    table: locations,
    nameColumn: "name",
  },
  person: {
    table: people,
    nameColumn: "name",
  },
  group: {
    table: groups,
    nameColumn: "name",
  },
  book: {
    table: books,
    nameColumn: "name",
  },
  podcast: {
    table: podcasts,
    nameColumn: "name",
  },
  movie: {
    table: movies,
    nameColumn: "name",
  },
  tvShow: {
    table: tvShows,
    nameColumn: "name",
  },
  episode: {
    table: episodes,
    nameColumn: "name",
  },
  album: {
    table: albums,
    nameColumn: "name",
  },
  track: {
    table: tracks,
    nameColumn: "name",
  },
};

/**
 * Load a batch of owners' entity names, joined with their language for display. The single batched
 * loader reused by every owner read path (bookmark hydration, entity detail). Returns
 * `Map<ownerId, EntityName[]>`, each list ordered by `sortOrder`. Empty input → empty map.
 */
export async function loadEntityNames(
  ownerType: EntityNameOwnerType,
  ownerIds: string[],
): Promise<Map<string, EntityName[]>> {
  const out = new Map<string, EntityName[]>();
  if (ownerIds.length === 0) return out;

  const rows = await db
    .select({
      id: entityNames.id,
      ownerId: entityNames.ownerId,
      value: entityNames.value,
      isPrimary: entityNames.isPrimary,
      sortOrder: entityNames.sortOrder,
      languageId: languages.id,
      languageName: languages.name,
      languageSlug: languages.slug,
      languageIsoCode: languages.isoCode,
    })
    .from(entityNames)
    .innerJoin(languages, eq(entityNames.languageId, languages.id))
    .where(and(eq(entityNames.ownerType, ownerType), inArray(entityNames.ownerId, ownerIds)))
    .orderBy(asc(entityNames.sortOrder));

  for (const row of rows) {
    const name: EntityName = {
      id: row.id,
      language: {
        id: row.languageId,
        name: row.languageName,
        slug: row.languageSlug ?? "",
        isoCode: row.languageIsoCode,
      },
      value: row.value,
      isPrimary: row.isPrimary,
      sortOrder: row.sortOrder,
    };
    const list = out.get(row.ownerId);
    if (list) list.push(name);
    else out.set(row.ownerId, [name]);
  }
  return out;
}

/** Load a single owner's entity names. */
export async function getEntityNames(
  ownerType: EntityNameOwnerType,
  ownerId: string,
): Promise<EntityName[]> {
  const map = await loadEntityNames(ownerType, [ownerId]);
  return map.get(ownerId) ?? [];
}

/** One prepared `entity_names` insert row. */
export interface EntityNameInsertRow {
  ownerType: string;
  ownerId: string;
  languageId: string;
  value: string;
  isPrimary: boolean;
  sortOrder: number;
}

/**
 * Prepare the rows to insert for a replace-all `setEntityNames`, and the primary value (if any) to
 * mirror into the owner's base name/title column. Pure so it is unit-tested directly. Entries are
 * deduped by `languageId` (respecting the unique index), blank values are dropped, and `sortOrder`
 * follows the (deduped) array order. Throws when more than one entry is flagged `isPrimary`.
 */
export function buildEntityNameRows(
  ownerType: EntityNameOwnerType,
  ownerId: string,
  entries: UpdateEntityNameEntry[],
): { rows: EntityNameInsertRow[];
  primaryValue: string | null; } {
  const seen = new Set<string>();
  const rows: EntityNameInsertRow[] = [];
  let primaryValue: string | null = null;
  for (const entry of entries) {
    if (seen.has(entry.languageId)) continue;
    seen.add(entry.languageId);
    const value = entry.value.trim();
    if (value.length === 0) continue;
    const isPrimary = entry.isPrimary === true;
    if (isPrimary && primaryValue !== null) {
      throw new Error("An entity may have at most one primary name.");
    }
    if (isPrimary) primaryValue = value;
    rows.push({
      ownerType,
      ownerId,
      languageId: entry.languageId,
      value,
      isPrimary,
      sortOrder: rows.length,
    });
  }
  return {
    rows,
    primaryValue,
  };
}

/**
 * Replace an owner's full set of entity names (delete-then-insert in a transaction). Entries are
 * deduped by `languageId` to respect the unique index; `sortOrder` follows the array order. At most
 * one entry may be flagged `isPrimary`; when a primary is present its value is written back to the
 * owner's base `name`/`title` column in the same transaction, keeping the denormalized primary in
 * sync. Bumps the bookmark cache when the owner is a bookmark (its title is matchable data).
 */
export async function setEntityNames(
  ownerType: EntityNameOwnerType,
  ownerId: string,
  entries: UpdateEntityNameEntry[],
): Promise<void> {
  const {
    rows, primaryValue,
  } = buildEntityNameRows(ownerType, ownerId, entries);

  const owner = OWNER_TABLES[ownerType];
  await db.transaction(async (tx) => {
    await tx
      .delete(entityNames)
      .where(and(eq(entityNames.ownerType, ownerType), eq(entityNames.ownerId, ownerId)));
    if (rows.length > 0) {
      await tx.insert(entityNames).values(rows);
    }
    // Keep the denormalized base column in sync with the primary row's value. Left untouched when no
    // entry is primary (the base column is NOT NULL and must never be cleared).
    if (primaryValue !== null) {
      await tx.execute(
        sql`UPDATE ${owner.table} SET ${sql.identifier(owner.nameColumn)} = ${primaryValue} WHERE ${sql.identifier("id")} = ${ownerId}`,
      );
    }
  });
  if (ownerType === "bookmark") invalidateBookmarkCache();
}

/**
 * Delete every entity name for an owner. Called from each owner entity's delete service — the
 * polymorphic `ownerId` has no FK, so this is the manual cleanup that prevents orphan rows.
 */
export async function deleteEntityNamesForOwner(
  ownerType: EntityNameOwnerType,
  ownerId: string,
): Promise<void> {
  await db
    .delete(entityNames)
    .where(and(eq(entityNames.ownerType, ownerType), eq(entityNames.ownerId, ownerId)));
  if (ownerType === "bookmark") invalidateBookmarkCache();
}
