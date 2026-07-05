import { asc, eq, sql } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateLanguageInput,
  Language,
  UpdateLanguageInput,
} from "@eesimple/types";
import { db } from "@/db";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { deleteGenreMoodAssignmentsForOwner } from "@/services/genreMoodAssignments";
import { languages, languageUsages, type LanguageRow } from "@/db/schema";
import { AppError } from "@/utils/errors";
import { LANGUAGE_CODES } from "@/utils/languageCodes";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing language name or ISO code. */
export class DuplicateLanguageError extends AppError {
  constructor(message: string) {
    super(message, "duplicateName", 409);
  }
}

/** Thrown when an update or delete targets a built-in language in a disallowed way. */
export class BuiltInLanguageError extends AppError {
  constructor(message: string) {
    super(message, "builtInImmutable", 403);
  }
}

/** Existing language slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(languages, languages.slug, languages.id, excludeId);

/** Map a DB row (plus an optional precomputed bookmark count) to the shared `Language` wire type. */
function toLanguage(row: LanguageRow & { bookmarkCount?: number }): Language {
  return {
    id: row.id,
    name: row.name,
    isoCode: row.isoCode,
    slug: row.slug ?? slugify(row.name),
    builtIn: row.builtIn,
    sortOrder: row.sortOrder,
    isFavorite: row.isFavorite,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: row.bookmarkCount,
  };
}

/**
 * Tally bookmarks per language via `language_usages` (a bookmark's language is now expressed as an
 * ordinary usage association, not a dedicated field). Counts distinct bookmarks so one bookmark
 * carrying two usage levels for the same language (e.g. "Primary Language" + "Dub") isn't double-counted.
 */
async function bookmarkCountsByLanguage(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      languageId: languageUsages.languageId,
      count: sql<number>`count(distinct ${languageUsages.ownerId})::int`,
    })
    .from(languageUsages)
    .where(eq(languageUsages.ownerType, "bookmark"))
    .groupBy(languageUsages.languageId);
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.languageId, row.count);
  return counts;
}

/** List all languages, ordered by their display order then name, with bookmark counts. */
export async function listLanguages(): Promise<Language[]> {
  const [rows, bookmarkCounts] = await Promise.all([
    db.select().from(languages).orderBy(asc(languages.sortOrder), asc(languages.name)),
    bookmarkCountsByLanguage(),
  ]);
  return rows.map(row => toLanguage({
    ...row,
    bookmarkCount: bookmarkCounts.get(row.id) ?? 0,
  }));
}

/** Add a custom language. Throws `DuplicateLanguageError` on a name or ISO-code clash. */
export async function createLanguage(input: CreateLanguageInput): Promise<Language> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateLanguageError("A language name is required");

  const [nameClash] = await db.select({
    id: languages.id,
  }).from(languages).where(eq(languages.name, name));
  if (nameClash) throw new DuplicateLanguageError(`A language named "${name}" already exists`);

  const isoCode = input.isoCode?.trim() || null;
  if (isoCode) {
    const [codeClash] = await db.select({
      id: languages.id,
    }).from(languages).where(eq(languages.isoCode, isoCode));
    if (codeClash) {
      throw new DuplicateLanguageError(`A language with ISO code "${isoCode}" already exists`);
    }
  }

  const slug = uniqueSlug(name, await takenSlugs(), "language");
  const [row] = await db.insert(languages).values({
    name,
    isoCode,
    slug,
    sortOrder: input.sortOrder ?? LANGUAGE_CODES.length,
  }).returning();
  return toLanguage(row);
}

/** Rename, re-code, and/or reorder a language. Built-ins cannot be renamed. */
export async function updateLanguage(
  id: string,
  input: UpdateLanguageInput,
): Promise<Language | null> {
  const [existing] = await db.select().from(languages).where(eq(languages.id, id));
  if (!existing) return null;
  if (existing.builtIn && input.name !== undefined && input.name.trim() !== existing.name) {
    throw new BuiltInLanguageError("A built-in language cannot be renamed");
  }

  const patch: Partial<Pick<LanguageRow, "name" | "isoCode" | "slug" | "sortOrder" | "isFavorite">> = {};
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: languages.id,
    }).from(languages).where(eq(languages.name, name));
    if (clash && clash.id !== id) {
      throw new DuplicateLanguageError(`A language named "${name}" already exists`);
    }
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id), "language");
  }
  if (input.isoCode !== undefined) {
    const isoCode = input.isoCode?.trim() || null;
    if (isoCode && isoCode !== existing.isoCode) {
      const [clash] = await db.select({
        id: languages.id,
      }).from(languages).where(eq(languages.isoCode, isoCode));
      if (clash && clash.id !== id) {
        throw new DuplicateLanguageError(`A language with ISO code "${isoCode}" already exists`);
      }
    }
    patch.isoCode = isoCode;
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (input.isFavorite !== undefined) patch.isFavorite = input.isFavorite;
  if (Object.keys(patch).length === 0) return toLanguage(existing);

  const [row] = await db.update(languages).set(patch).where(eq(languages.id, id)).returning();
  return row ? toLanguage(row) : null;
}

/** Delete a language. Built-ins cannot be deleted. Its `language_usages` rows cascade-delete. */
export async function deleteLanguage(id: string): Promise<boolean> {
  const [existing] = await db.select({
    builtIn: languages.builtIn,
  }).from(languages).where(eq(languages.id, id));
  if (!existing) return false;
  if (existing.builtIn) throw new BuiltInLanguageError("A built-in language cannot be deleted");
  const rows = await db.delete(languages).where(eq(languages.id, id)).returning({
    id: languages.id,
  });
  // The cascaded language_usages rows are matchable data.
  if (rows.length > 0) {
    // Genre/mood assignments key off (ownerType, ownerId) with no FK on ownerId, so clean them up here.
    await deleteGenreMoodAssignmentsForOwner("language", id);
    invalidateBookmarkCache();
  }
  return rows.length > 0;
}

/** Delete many languages, reporting per-item outcomes (built-ins are skipped). */
export function bulkDeleteLanguages(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteLanguage, err => err instanceof BuiltInLanguageError);
}

/**
 * Ensure the seeded built-in languages exist. Idempotent and safe to call at boot: inserts any
 * missing built-in by slug. The table is created with `slug` from the first boot, so every row
 * always has a slug — no backfill is needed.
 */
export async function ensureBuiltInLanguages(): Promise<void> {
  let order = 0;
  for (const entry of LANGUAGE_CODES) {
    const slug = slugify(entry.name);
    await db
      .insert(languages)
      .values({
        name: entry.name,
        isoCode: entry.code,
        slug,
        builtIn: true,
        sortOrder: order,
      })
      .onConflictDoNothing({
        target: languages.slug,
      });
    order += 1;
  }
}
