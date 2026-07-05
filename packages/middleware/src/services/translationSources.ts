import { asc, eq, isNull, sql } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateTranslationSourceInput,
  TranslationSource,
  UpdateTranslationSourceInput,
} from "@eesimple/types";
import { BUILT_IN_TRANSLATION_SOURCE_NAMES } from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { languageUsages, translationSources, type TranslationSourceRow } from "@/db/schema";
import { AppError } from "@/utils/errors";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing translation-source name. */
export class DuplicateTranslationSourceError extends AppError {
  constructor(name: string) {
    super(`A translation source named "${name}" already exists`, "duplicateName", 409, {
      entity: "translation source",
      name,
    });
  }
}

/** Thrown when editing/deleting a seeded built-in translation source. */
export class BuiltInTranslationSourceError extends AppError {
  constructor() {
    super("Built-in translation sources can't be modified or deleted", "builtInImmutable", 403);
  }
}

/** Thrown when a delete's `reassignTo` target is missing or is the source being deleted. */
export class InvalidTranslationSourceReassignError extends AppError {
  constructor(message = "Invalid reassignment target") {
    super(message, "invalidReassignTarget", 400);
  }
}

/** Map a DB row to the shared `TranslationSource` wire type. */
function toSource(row: TranslationSourceRow, usageCount = 0): TranslationSource {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    builtIn: row.builtIn,
    sortOrder: row.sortOrder,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    usageCount,
  };
}

/** Existing translation-source slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(translationSources, translationSources.slug, translationSources.id, excludeId);

/** Count associations per translation source. Returns a `sourceId → count` map. */
async function usageCountsBySource(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      sourceId: languageUsages.translationSourceId,
      count: sql<number>`count(*)::int`,
    })
    .from(languageUsages)
    .where(sql`${languageUsages.translationSourceId} IS NOT NULL`)
    .groupBy(languageUsages.translationSourceId);
  const out = new Map<string, number>();
  for (const r of rows) {
    if (r.sourceId) out.set(r.sourceId, r.count);
  }
  return out;
}

/** List translation sources, ordered by sort order then name. */
export async function listTranslationSources(): Promise<TranslationSource[]> {
  const [rows, counts] = await Promise.all([
    db
      .select()
      .from(translationSources)
      .orderBy(asc(translationSources.sortOrder), asc(translationSources.name)),
    usageCountsBySource(),
  ]);
  return rows.map(row => toSource(row, counts.get(row.id) ?? 0));
}

/** Add a translation source. Throws `DuplicateTranslationSourceError` on a name clash. */
export async function createTranslationSource(
  input: CreateTranslationSourceInput,
): Promise<TranslationSource> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateTranslationSourceError(input.name);

  const [clash] = await db
    .select({
      id: translationSources.id,
    })
    .from(translationSources)
    .where(eq(translationSources.name, name));
  if (clash) throw new DuplicateTranslationSourceError(name);

  const slug = uniqueSlug(name, await takenSlugs(), "translation-source");
  const [row] = await db
    .insert(translationSources)
    .values({
      name,
      slug,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  return toSource(row);
}

/** Update a translation source's name and/or sort order. Built-ins can't be renamed. */
export async function updateTranslationSource(
  id: string,
  input: UpdateTranslationSourceInput,
): Promise<TranslationSource | null> {
  const [existing] = await db.select().from(translationSources).where(eq(translationSources.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<TranslationSourceRow, "name" | "slug" | "sortOrder">> = {};
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    if (existing.builtIn) throw new BuiltInTranslationSourceError();
    const name = input.name.trim();
    const [clash] = await db
      .select({
        id: translationSources.id,
      })
      .from(translationSources)
      .where(eq(translationSources.name, name));
    if (clash && clash.id !== id) throw new DuplicateTranslationSourceError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id), "translation-source");
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) return toSource(existing);

  const [row] = await db
    .update(translationSources)
    .set(patch)
    .where(eq(translationSources.id, id))
    .returning();
  return row ? toSource(row) : null;
}

/**
 * Delete a translation source. Returns false when not found. Built-ins can't be deleted.
 *
 * When `reassignToId` is given, associations carrying the deleted source are moved to the target
 * source. Without `reassignToId`, associations referencing the source have their
 * `translationSourceId` cleared to null (the FK is nullable — the usage row itself is kept). Either
 * way `invalidateBookmarkCache()` is called since bookmark associations may be affected.
 */
export async function deleteTranslationSource(id: string, reassignToId?: string): Promise<boolean> {
  const [existing] = await db.select().from(translationSources).where(eq(translationSources.id, id));
  if (!existing) return false;
  if (existing.builtIn) throw new BuiltInTranslationSourceError();

  if (reassignToId !== undefined) {
    if (reassignToId === id) throw new InvalidTranslationSourceReassignError();
    const [target] = await db
      .select()
      .from(translationSources)
      .where(eq(translationSources.id, reassignToId));
    if (!target) throw new InvalidTranslationSourceReassignError("Reassignment target not found");
    await db
      .update(languageUsages)
      .set({
        translationSourceId: reassignToId,
      })
      .where(eq(languageUsages.translationSourceId, id));
  }
  else {
    await db
      .update(languageUsages)
      .set({
        translationSourceId: null,
      })
      .where(eq(languageUsages.translationSourceId, id));
  }
  invalidateBookmarkCache();

  const rows = await db
    .delete(translationSources)
    .where(eq(translationSources.id, id))
    .returning({
      id: translationSources.id,
    });
  return rows.length > 0;
}

const isBuiltInSourceError = (err: unknown): boolean => err instanceof BuiltInTranslationSourceError;

/** Delete many translation sources, reporting per-item outcomes (skipping built-ins). */
export function bulkDeleteTranslationSources(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, id => deleteTranslationSource(id), isBuiltInSourceError);
}

/** Seed the built-in translation sources — idempotent boot step. */
export async function ensureBuiltInTranslationSources(): Promise<void> {
  let order = 0;
  for (const name of BUILT_IN_TRANSLATION_SOURCE_NAMES) {
    const slug = slugify(name);
    await db
      .insert(translationSources)
      .values({
        name,
        slug,
        builtIn: true,
        sortOrder: order,
      })
      .onConflictDoNothing({
        target: translationSources.slug,
      });
    order += 1;
  }
}

/** Fill in slugs for any translation sources missing one (e.g. rows that predate the `slug` column). */
export async function backfillTranslationSourceSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: translationSources.id,
      name: translationSources.name,
    })
    .from(translationSources)
    .where(isNull(translationSources.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const source of missing) {
    const slug = uniqueSlug(source.name, taken, "translation-source");
    taken.push(slug);
    await db.update(translationSources).set({
      slug,
    }).where(eq(translationSources.id, source.id));
  }
}
