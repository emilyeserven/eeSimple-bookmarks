import { and, asc, eq, inArray } from "drizzle-orm";
import type { LanguageUsage, LanguageUsageKind, LanguageUsageOwnerType, UpdateLanguageUsageEntry } from "@eesimple/types";
import { db } from "@/db";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { languages, languageUsageLevels, languageUsages } from "@/db/schema";

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
    })
    .from(languageUsages)
    .innerJoin(languages, eq(languageUsages.languageId, languages.id))
    .innerJoin(languageUsageLevels, eq(languageUsages.usageLevelId, languageUsageLevels.id))
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
      note: row.note,
    };
    const list = out.get(row.ownerId);
    if (list) list.push(usage);
    else out.set(row.ownerId, [usage]);
  }
  return out;
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
