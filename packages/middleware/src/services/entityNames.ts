import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { EntityName, EntityNameOwnerType, UpdateEntityNameEntry } from "@eesimple/types";
import { db } from "@/db";
// Import from the leaf `bookmarkCacheVersion` module (not `bookmarkCache`, which imports
// `categories`) so an owner service the cache loads from — `categories` calls
// `deleteEntityNamesForOwner` — doesn't form a circular import.
import { invalidateBookmarkCache } from "@/services/bookmarkCacheVersion";
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
  languageUsageLevels,
  languageUsages,
  locations,
  mediaTypes,
  movies,
  people,
  podcasts,
  tags,
  tracks,
  tvShows,
} from "@/db/schema";
import { getDisplayPreferenceSettings } from "@/services/appSettings";
import { detectNameLanguage } from "@/utils/scriptDetection";

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

/** Resolve the built-in English language's row id by ISO code, or `null` if it's somehow absent. */
export async function resolveEnglishLanguageId(): Promise<string | null> {
  const [row] = await db
    .select({
      id: languages.id,
    })
    .from(languages)
    .where(eq(languages.isoCode, "en"));
  return row?.id ?? null;
}

/**
 * Merge a single English-language name value into an owner's `entity_names`, replacing any existing
 * English row while leaving every other language's row untouched (`setEntityNames` is a replace-all
 * setter, so this loads the current rows first). Used by owners that resolve an "English name"
 * candidate from an outside source (e.g. Wikidata) alongside their other, already-populated names —
 * see `services/plexTaxonomyService.ts` and `services/locations.ts`. No-ops when the English language
 * row is missing or `englishName` is blank.
 */
export async function mergeEnglishEntityName(
  ownerType: EntityNameOwnerType,
  ownerId: string,
  englishName: string,
): Promise<void> {
  const value = englishName.trim();
  if (value.length === 0) return;
  const englishLanguageId = await resolveEnglishLanguageId();
  if (englishLanguageId === null) return;

  const current = (await loadEntityNames(ownerType, [ownerId])).get(ownerId) ?? [];
  const merged: UpdateEntityNameEntry[] = [
    ...current
      .filter(name => name.language.id !== englishLanguageId)
      .map(name => ({
        languageId: name.language.id,
        value: name.value,
        isPrimary: name.isPrimary,
      })),
    {
      languageId: englishLanguageId,
      value,
      isPrimary: current.some(name => name.language.id === englishLanguageId && name.isPrimary),
    },
  ];
  await setEntityNames(ownerType, ownerId, merged);
}

// --- #966 backfill: seed entity_names from existing name/title + romanized_name -----------------

/** Rows inserted per batch. Keeps each INSERT within Postgres' bind-parameter limit. */
const ENTITY_NAME_BACKFILL_CHUNK = 500;

/** The resolved language ids the backfill labels rows with. English is guaranteed; ja/ko/zh may be absent. */
interface BackfillLanguageIds {
  en: string;
  ja: string | null;
  ko: string | null;
  zh: string | null;
}

/** One `language_usages` row staged for the Primary Language attach (bookmarks only). */
interface PrimaryLanguageUsageRow {
  ownerType: "bookmark";
  ownerId: string;
  languageId: string;
  usageLevelId: string;
  sortOrder: number;
}

interface BackfillCounts {
  primary: number;
  english: number;
  skippedPrimary: number;
  skippedDuplicateEnglish: number;
}

/**
 * Decide the `entity_names` rows to seed for one owner from its current base name/title (`name`) +
 * optional `romanized`. Pure, so the judgement calls are unit-tested directly.
 *
 * - A detected primary language (ko/ja/en) yields the `isPrimary` row labelled with that language.
 * - An undetermined script (Han-only / mixed / other), a missing language id, or a blank name yields
 *   no primary row (`undetermined`) — the base column stays the display source, since
 *   `entity_names.languageId` is NOT NULL and we never mint an unlabelled row.
 * - A non-empty `romanized` becomes the English (non-primary) row, unless English is already the
 *   primary (then it would duplicate / collide on the unique index — `duplicateEnglish`, skipped).
 */
export function planEntityNameBackfillRows(
  ownerType: EntityNameOwnerType,
  ownerId: string,
  name: string,
  romanized: string | null,
  detected: "ko" | "ja" | "en" | "zh" | null,
  languageIds: BackfillLanguageIds,
): { rows: EntityNameInsertRow[];
  undetermined: boolean;
  duplicateEnglish: boolean; } {
  const rows: EntityNameInsertRow[] = [];
  const primaryValue = name.trim();
  const byLanguage: Record<"ko" | "ja" | "en" | "zh", string | null> = {
    en: languageIds.en,
    ja: languageIds.ja,
    ko: languageIds.ko,
    zh: languageIds.zh,
  };
  const primaryLanguageId = detected ? byLanguage[detected] : null;
  if (primaryLanguageId !== null && primaryValue.length > 0) {
    rows.push({
      ownerType,
      ownerId,
      languageId: primaryLanguageId,
      value: primaryValue,
      isPrimary: true,
      sortOrder: 0,
    });
  }
  const undetermined = rows.length === 0;

  const romanizedValue = romanized?.trim() ?? "";
  let duplicateEnglish = false;
  if (romanizedValue.length > 0) {
    if (detected === "en") {
      duplicateEnglish = true; // English is already the primary — don't duplicate it.
    }
    else {
      rows.push({
        ownerType,
        ownerId,
        languageId: languageIds.en,
        value: romanizedValue,
        isPrimary: false,
        sortOrder: rows.length,
      });
    }
  }
  return {
    rows,
    undetermined,
    duplicateEnglish,
  };
}

/**
 * Stage a Primary Language `language_usages` row for a bookmark whose title is Korean, Japanese, or
 * Chinese (Han-only titles resolve to ja/zh via the operator's preference). English/Latin bookmarks
 * are intentionally excluded — attaching `en` to (nearly) the whole library would flood it with
 * noise; English-primary stays implicit via the names table. Returns `null` when the owner isn't a
 * bookmark, the level is missing, the script isn't ko/ja/zh, or the language is absent.
 */
function planPrimaryLanguageUsage(
  ownerType: EntityNameOwnerType,
  ownerId: string,
  detected: "ko" | "ja" | "en" | "zh" | null,
  languageIds: BackfillLanguageIds,
  primaryLevelId: string | null,
): PrimaryLanguageUsageRow | null {
  if (ownerType !== "bookmark" || primaryLevelId === null) return null;
  if (detected !== "ko" && detected !== "ja" && detected !== "zh") return null;
  const languageId = languageIds[detected];
  if (languageId === null) return null;
  return {
    ownerType: "bookmark",
    ownerId,
    languageId,
    usageLevelId: primaryLevelId,
    sortOrder: 0,
  };
}

/** Resolve the en/ja/ko/zh language ids by ISO code (built-ins seeded by boot time). */
async function resolveBackfillLanguageIds(): Promise<{ en: string | null;
  ja: string | null;
  ko: string | null;
  zh: string | null; }> {
  const rows = await db
    .select({
      id: languages.id,
      isoCode: languages.isoCode,
    })
    .from(languages)
    .where(inArray(languages.isoCode, ["en", "ja", "ko", "zh"]));
  const out: { en: string | null;
    ja: string | null;
    ko: string | null;
    zh: string | null; } = {
    en: null,
    ja: null,
    ko: null,
    zh: null,
  };
  for (const row of rows) {
    if (row.isoCode === "en") out.en = row.id;
    else if (row.isoCode === "ja") out.ja = row.id;
    else if (row.isoCode === "ko") out.ko = row.id;
    else if (row.isoCode === "zh") out.zh = row.id;
  }
  return out;
}

/** Resolve the availability-kind "Primary Language" level id (case-insensitive on name), or null. */
async function resolvePrimaryLanguageLevelId(): Promise<string | null> {
  const rows = await db
    .select({
      id: languageUsageLevels.id,
    })
    .from(languageUsageLevels)
    .where(and(
      eq(languageUsageLevels.kind, "availability"),
      sql`lower(${languageUsageLevels.name}) = 'primary language'`,
    ));
  return rows[0]?.id ?? null;
}

/** Owners of the given type that have no `entity_names` row yet (the idempotency guard). */
async function selectOwnersWithoutNames(
  owner: { table: PgTable;
    nameColumn: string; },
  ownerType: EntityNameOwnerType,
): Promise<{ id: string;
  name: string | null;
  romanized: string | null; }[]> {
  const result = (await db.execute<{ id: string;
    name: string | null;
    romanized: string | null; }>(sql`
    SELECT o.id AS id, o.${sql.identifier(owner.nameColumn)} AS name, o.romanized_name AS romanized
    FROM ${owner.table} o
    WHERE NOT EXISTS (
      SELECT 1 FROM ${entityNames} e
      WHERE e.owner_type = ${ownerType} AND e.owner_id = o.id
    )
  `)) as unknown as { rows: { id: string;
    name: string | null;
    romanized: string | null; }[]; };
  return result.rows;
}

/** Drop bookmarks that already carry a Primary Language usage (belt-and-braces idempotency). */
async function filterBookmarksWithoutPrimaryLanguage(
  rows: PrimaryLanguageUsageRow[],
  primaryLevelId: string,
): Promise<PrimaryLanguageUsageRow[]> {
  const ownerIds = rows.map(row => row.ownerId);
  const existing = await db
    .select({
      ownerId: languageUsages.ownerId,
    })
    .from(languageUsages)
    .where(and(
      eq(languageUsages.ownerType, "bookmark"),
      eq(languageUsages.usageLevelId, primaryLevelId),
      inArray(languageUsages.ownerId, ownerIds),
    ));
  const has = new Set(existing.map(row => row.ownerId));
  return rows.filter(row => !has.has(row.ownerId));
}

/** Accumulate the name + usage rows to insert for one owner type, plus the per-owner counts. */
function collectOwnerBackfill(
  ownerType: EntityNameOwnerType,
  sourceRows: { id: string;
    name: string | null;
    romanized: string | null; }[],
  languageIds: BackfillLanguageIds,
  primaryLevelId: string | null,
  hanFallback: "ja" | "zh" | null,
): { nameRows: EntityNameInsertRow[];
  usageRows: PrimaryLanguageUsageRow[];
  counts: BackfillCounts; } {
  const nameRows: EntityNameInsertRow[] = [];
  const usageRows: PrimaryLanguageUsageRow[] = [];
  const counts: BackfillCounts = {
    primary: 0,
    english: 0,
    skippedPrimary: 0,
    skippedDuplicateEnglish: 0,
  };
  for (const row of sourceRows) {
    const value = row.name ?? "";
    const detected = detectNameLanguage(value, hanFallback);
    const plan = planEntityNameBackfillRows(ownerType, row.id, value, row.romanized, detected, languageIds);
    for (const nameRow of plan.rows) {
      nameRows.push(nameRow);
      if (nameRow.isPrimary) counts.primary += 1;
      else counts.english += 1;
    }
    if (plan.undetermined) counts.skippedPrimary += 1;
    if (plan.duplicateEnglish) counts.skippedDuplicateEnglish += 1;
    const usage = planPrimaryLanguageUsage(ownerType, row.id, detected, languageIds, primaryLevelId);
    if (usage !== null) usageRows.push(usage);
  }
  return {
    nameRows,
    usageRows,
    counts,
  };
}

/** Insert `rows` in bounded batches, running `insert` once per chunk. */
async function insertInChunks<T>(rows: T[], insert: (chunk: T[]) => Promise<unknown>): Promise<void> {
  for (let i = 0; i < rows.length; i += ENTITY_NAME_BACKFILL_CHUNK) {
    await insert(rows.slice(i, i + ENTITY_NAME_BACKFILL_CHUNK));
  }
}

/**
 * One-time, idempotent boot backfill (#966): seed `entity_names` from every owner's existing
 * name/title + `romanized_name`, labelling each by its detected script's language, and attach a
 * "Primary Language" `language_usages` row to Korean/Japanese bookmarks. Re-runs insert nothing — an
 * owner that already has any `entity_names` row is skipped, so a second boot logs all-zero counts.
 */
export async function backfillEntityNames(): Promise<void> {
  const resolved = await resolveBackfillLanguageIds();
  if (resolved.en === null) {
    console.warn("[backfillEntityNames] English language row missing; skipping backfill.");
    return;
  }
  const languageIds: BackfillLanguageIds = {
    en: resolved.en,
    ja: resolved.ja,
    ko: resolved.ko,
    zh: resolved.zh,
  };
  const primaryLevelId = await resolvePrimaryLanguageLevelId();
  // Han-only (no-kana) names are ambiguous Japanese vs. Chinese; resolve them to the operator's
  // configured preference (default Japanese). ensureAppSettings() runs earlier in the boot chain.
  const {
    hanScriptLanguage,
  } = await getDisplayPreferenceSettings();

  const totals: BackfillCounts = {
    primary: 0,
    english: 0,
    skippedPrimary: 0,
    skippedDuplicateEnglish: 0,
  };
  let attachedPrimaryLanguage = 0;

  for (const [type, owner] of Object.entries(OWNER_TABLES)) {
    const ownerType = type as EntityNameOwnerType;
    const sourceRows = await selectOwnersWithoutNames(owner, ownerType);
    if (sourceRows.length === 0) continue;

    const {
      nameRows, usageRows, counts,
    } = collectOwnerBackfill(ownerType, sourceRows, languageIds, primaryLevelId, hanScriptLanguage);
    await insertInChunks(nameRows, chunk => db.insert(entityNames).values(chunk));
    if (usageRows.length > 0 && primaryLevelId !== null) {
      const fresh = await filterBookmarksWithoutPrimaryLanguage(usageRows, primaryLevelId);
      await insertInChunks(fresh, chunk => db.insert(languageUsages).values(chunk).onConflictDoNothing());
      attachedPrimaryLanguage += fresh.length;
    }
    totals.primary += counts.primary;
    totals.english += counts.english;
    totals.skippedPrimary += counts.skippedPrimary;
    totals.skippedDuplicateEnglish += counts.skippedDuplicateEnglish;
  }

  // Bookmark language usages are matchable data; bust the cache once if any were written.
  if (attachedPrimaryLanguage > 0) invalidateBookmarkCache();
  console.info(
    `[backfillEntityNames] primaryNames=${totals.primary} englishNames=${totals.english} `
    + `skippedPrimary=${totals.skippedPrimary} skippedDuplicateEnglish=${totals.skippedDuplicateEnglish} `
    + `primaryLanguageUsages=${attachedPrimaryLanguage}`,
  );
}
