import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { EntityName, EntityNameOwnerType, UpdateEntityNameEntry } from "@eesimple/types";
import { db } from "@/db";
// Import from the leaf `bookmarkCacheVersion` module (not `bookmarkCache`, which imports
// `categories`) so an owner service the cache loads from — `categories` calls
// `deleteEntityNamesForOwner` — doesn't form a circular import.
import { invalidateBookmarkCache } from "@/services/bookmarkCacheVersion";
import {
  bookmarks,
  categories,
  entityNames,
  genreMoods,
  groups,
  languages,
  locations,
  mediaTypes,
  people,
  tags,
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

/** The resolved language ids the backfill labels rows with. English is guaranteed; ja/ko/zh may be absent. */
interface BackfillLanguageIds {
  en: string;
  ja: string | null;
  ko: string | null;
  zh: string | null;
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

/** Resolve the en/ja/ko/zh language ids by ISO code (built-ins seeded by boot time). */
export async function resolveBackfillLanguageIds(): Promise<{ en: string | null;
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

// --- #985 create-time primary-name derivation --------------------------------------------------

/**
 * Decide the primary `entity_names` entry for a *new* bookmark from its title's script, using the
 * site's detected language as the Han-only (ambiguous ja/zh) tiebreaker ahead of the global
 * `hanScriptLanguage` default. Pure, so it is unit-tested directly. Returns a single-element array
 * (`isPrimary`) when the script resolves to a seeded language, else `[]` (undetermined title, blank
 * title, or the target language row missing) — matching the backfill's "no unlabelled row" rule.
 *
 * Only the Han-only branch consults `siteLanguageCode`; a definitive script (kana → ja, hangul → ko,
 * Latin → en) wins regardless of the site. `siteLanguageCode` is only honoured when it is itself an
 * ambiguous CJK code (`ja`/`zh`); any other value (or absent) falls back to `hanScriptLanguage`.
 */
export function pickDetectedPrimaryName(
  title: string,
  siteLanguageCode: string | null | undefined,
  hanScriptLanguage: "ja" | "zh",
  languageIds: BackfillLanguageIds,
): UpdateEntityNameEntry[] {
  const hanFallback = siteLanguageCode === "ja" || siteLanguageCode === "zh"
    ? siteLanguageCode
    : hanScriptLanguage;
  const detected = detectNameLanguage(title, hanFallback);
  const value = title.trim();
  const languageId = detected ? languageIds[detected] : null;
  return languageId !== null && value.length > 0
    ? [{
      languageId,
      value,
      isPrimary: true,
    }]
    : [];
}

/**
 * Resolve the operator preference + seeded language ids and derive the primary-name entry for a new
 * bookmark (see {@link pickDetectedPrimaryName}). No-ops to `[]` when the English row is somehow
 * missing (so `ensure*` boot steps haven't run).
 */
export async function deriveDetectedPrimaryNames(
  title: string,
  siteLanguageCode: string | null | undefined,
): Promise<UpdateEntityNameEntry[]> {
  const {
    hanScriptLanguage,
  } = await getDisplayPreferenceSettings();
  const resolved = await resolveBackfillLanguageIds();
  if (resolved.en === null) return [];
  return pickDetectedPrimaryName(title, siteLanguageCode, hanScriptLanguage, {
    en: resolved.en,
    ja: resolved.ja,
    ko: resolved.ko,
    zh: resolved.zh,
  });
}
