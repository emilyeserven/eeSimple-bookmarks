import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type {
  LanguageUsage,
  LanguageUsageAssociation,
  LanguageUsageKind,
  LanguageUsageOwnerType,
  UpdateLanguageUsageEntry,
} from "@eesimple/types";
import { db } from "@/db";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { languages, languageUsageLevels, languageUsages, translationSources } from "@/db/schema";

/**
 * Load a batch of owners' language usages, joined with their language + usage-level for display.
 * The single batched loader reused by every owner read path (bookmark hydration, entity detail).
 * Returns `Map<ownerId, LanguageUsage[]>`, each list ordered by `sortOrder`. Empty input → empty map.
 */
export async function loadLanguageUsages(
  ownerType: LanguageUsageOwnerType,
  ownerIds: string[],
): Promise<Map<string, LanguageUsage[]>> {
  const out = new Map<string, LanguageUsage[]>();
  if (ownerIds.length === 0) return out;

  const rows = await db
    .select({
      id: languageUsages.id,
      ownerId: languageUsages.ownerId,
      note: languageUsages.note,
      languageId: languages.id,
      languageName: languages.name,
      languageSlug: languages.slug,
      languageIsoCode: languages.isoCode,
      levelId: languageUsageLevels.id,
      levelName: languageUsageLevels.name,
      levelSlug: languageUsageLevels.slug,
      levelKind: languageUsageLevels.kind,
      translationSourceId: translationSources.id,
      translationSourceName: translationSources.name,
      translationSourceSlug: translationSources.slug,
    })
    .from(languageUsages)
    .innerJoin(languages, eq(languageUsages.languageId, languages.id))
    .innerJoin(languageUsageLevels, eq(languageUsages.usageLevelId, languageUsageLevels.id))
    .leftJoin(translationSources, eq(languageUsages.translationSourceId, translationSources.id))
    .where(and(eq(languageUsages.ownerType, ownerType), inArray(languageUsages.ownerId, ownerIds)))
    .orderBy(asc(languageUsages.sortOrder));

  for (const row of rows) {
    const usage: LanguageUsage = {
      id: row.id,
      language: {
        id: row.languageId,
        name: row.languageName,
        slug: row.languageSlug ?? "",
        isoCode: row.languageIsoCode,
      },
      level: {
        id: row.levelId,
        name: row.levelName,
        slug: row.levelSlug ?? "",
        kind: row.levelKind as LanguageUsageKind,
      },
      translationSource: row.translationSourceId
        ? {
          id: row.translationSourceId,
          name: row.translationSourceName ?? "",
          slug: row.translationSourceSlug ?? "",
        }
        : null,
      note: row.note,
    };
    const list = out.get(row.ownerId);
    if (list) list.push(usage);
    else out.set(row.ownerId, [usage]);
  }
  return out;
}

/**
 * List every distinct (language, usage-level) pairing across all owners, with an association count.
 * Powers the Language Usage Levels overview (grouped by level or by language). Ordered by kind, then
 * level sort order, then language name for a stable display.
 */
export async function listLanguageUsageAssociations(): Promise<LanguageUsageAssociation[]> {
  const rows = await db
    .select({
      languageId: languages.id,
      languageName: languages.name,
      languageSlug: languages.slug,
      levelId: languageUsageLevels.id,
      levelName: languageUsageLevels.name,
      levelSlug: languageUsageLevels.slug,
      levelKind: languageUsageLevels.kind,
      count: sql<number>`count(*)::int`,
    })
    .from(languageUsages)
    .innerJoin(languages, eq(languageUsages.languageId, languages.id))
    .innerJoin(languageUsageLevels, eq(languageUsages.usageLevelId, languageUsageLevels.id))
    .groupBy(
      languages.id,
      languages.name,
      languages.slug,
      languageUsageLevels.id,
      languageUsageLevels.name,
      languageUsageLevels.slug,
      languageUsageLevels.kind,
      languageUsageLevels.sortOrder,
    )
    .orderBy(
      asc(languageUsageLevels.kind),
      asc(languageUsageLevels.sortOrder),
      asc(languages.name),
    );

  return rows.map(row => ({
    language: {
      id: row.languageId,
      name: row.languageName,
      slug: row.languageSlug ?? "",
    },
    level: {
      id: row.levelId,
      name: row.levelName,
      slug: row.levelSlug ?? "",
      kind: row.levelKind as LanguageUsageKind,
    },
    count: row.count,
  }));
}

/**
 * The `(languageId, usageLevelId)` pairs for every owner of one `ownerType`, grouped by `ownerId`.
 * Powers the bookmark-listing "Media" tab's independent-match check (see
 * `mediaItemsForBookmarks.ts`) without an N+1 per media item — ids only, no join, since the caller
 * only needs to compare against the sidebar's selected language/level ids.
 */
export async function listLanguageUsagesByOwnerType(
  ownerType: LanguageUsageOwnerType,
): Promise<Record<string, { languageId: string;
  usageLevelId: string; }[]>> {
  const rows = await db
    .select({
      ownerId: languageUsages.ownerId,
      languageId: languageUsages.languageId,
      usageLevelId: languageUsages.usageLevelId,
    })
    .from(languageUsages)
    .where(eq(languageUsages.ownerType, ownerType));
  const byOwner: Record<string, { languageId: string;
    usageLevelId: string; }[]> = {};
  for (const row of rows) {
    (byOwner[row.ownerId] ??= []).push({
      languageId: row.languageId,
      usageLevelId: row.usageLevelId,
    });
  }
  return byOwner;
}

/** Load a single owner's language usages. */
export async function getLanguageUsages(
  ownerType: LanguageUsageOwnerType,
  ownerId: string,
): Promise<LanguageUsage[]> {
  const map = await loadLanguageUsages(ownerType, [ownerId]);
  return map.get(ownerId) ?? [];
}

/**
 * Replace an owner's full set of language usages (delete-then-insert in a transaction). Entries are
 * deduped by `(languageId, usageLevelId)` to respect the unique constraint; `sortOrder` follows the
 * array order. Bumps the bookmark cache when the owner is a bookmark (its associations are matchable).
 */
export async function setLanguageUsages(
  ownerType: LanguageUsageOwnerType,
  ownerId: string,
  entries: UpdateLanguageUsageEntry[],
): Promise<void> {
  const seen = new Set<string>();
  const rows: { ownerType: string;
    ownerId: string;
    languageId: string;
    usageLevelId: string;
    translationSourceId: string | null;
    note: string | null;
    sortOrder: number; }[] = [];
  for (const entry of entries) {
    const key = `${entry.languageId}:${entry.usageLevelId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const note = entry.note?.trim();
    rows.push({
      ownerType,
      ownerId,
      languageId: entry.languageId,
      usageLevelId: entry.usageLevelId,
      translationSourceId: entry.translationSourceId ?? null,
      note: note && note.length > 0 ? note : null,
      sortOrder: rows.length,
    });
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(languageUsages)
      .where(and(eq(languageUsages.ownerType, ownerType), eq(languageUsages.ownerId, ownerId)));
    if (rows.length > 0) {
      await tx.insert(languageUsages).values(rows);
    }
  });
  if (ownerType === "bookmark") invalidateBookmarkCache();
}

/**
 * Delete every language usage for an owner. Called from each owner entity's delete service — the
 * polymorphic `ownerId` has no FK, so this is the manual cleanup that prevents orphan rows.
 */
export async function deleteLanguageUsagesForOwner(
  ownerType: LanguageUsageOwnerType,
  ownerId: string,
): Promise<void> {
  await db
    .delete(languageUsages)
    .where(and(eq(languageUsages.ownerType, ownerType), eq(languageUsages.ownerId, ownerId)));
  if (ownerType === "bookmark") invalidateBookmarkCache();
}
