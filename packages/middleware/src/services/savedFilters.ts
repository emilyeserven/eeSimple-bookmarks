import { asc, eq, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateSavedFilterInput,
  SavedFilter,
  UpdateSavedFilterInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { savedFilters, type SavedFilterRow } from "@/db/schema";
import { uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

function toSavedFilter(row: SavedFilterRow): SavedFilter {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    filters: row.filters,
    viewableOnline: row.viewableOnline,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(savedFilters, savedFilters.slug, savedFilters.id, excludeId);

export async function listSavedFilters(): Promise<SavedFilter[]> {
  const rows = await db
    .select()
    .from(savedFilters)
    .orderBy(asc(savedFilters.name));
  return rows.map(toSavedFilter);
}

export async function getSavedFilterById(id: string): Promise<SavedFilter | null> {
  const [row] = await db
    .select()
    .from(savedFilters)
    .where(eq(savedFilters.id, id));
  return row ? toSavedFilter(row) : null;
}

export async function getSavedFilterBySlug(slug: string): Promise<SavedFilter | null> {
  const [row] = await db
    .select()
    .from(savedFilters)
    .where(eq(savedFilters.slug, slug));
  return row ? toSavedFilter(row) : null;
}

export async function createSavedFilter(input: CreateSavedFilterInput): Promise<SavedFilter> {
  const slug = uniqueSlug(input.name, await takenSlugs());
  const [row] = await db
    .insert(savedFilters)
    .values({
      name: input.name,
      slug,
      description: input.description ?? null,
      filters: input.filters,
      viewableOnline: input.viewableOnline ?? false,
    })
    .returning();
  return toSavedFilter(row);
}

export async function updateSavedFilter(
  id: string,
  input: UpdateSavedFilterInput,
): Promise<SavedFilter | null> {
  const updates: Partial<typeof savedFilters.$inferInsert> = {};
  if (input.name !== undefined) {
    updates.name = input.name;
    updates.slug = uniqueSlug(input.name, await takenSlugs(id));
  }
  if (input.description !== undefined) updates.description = input.description ?? null;
  if (input.filters !== undefined) updates.filters = input.filters;
  if (input.viewableOnline !== undefined) updates.viewableOnline = input.viewableOnline;

  if (Object.keys(updates).length === 0) {
    return getSavedFilterById(id);
  }

  const [row] = await db
    .update(savedFilters)
    .set(updates)
    .where(eq(savedFilters.id, id))
    .returning();
  return row ? toSavedFilter(row) : null;
}

export async function deleteSavedFilter(id: string): Promise<boolean> {
  const result = await db
    .delete(savedFilters)
    .where(eq(savedFilters.id, id))
    .returning({
      id: savedFilters.id,
    });
  return result.length > 0;
}

export function bulkDeleteSavedFilters(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteSavedFilter);
}

/** Fill in slugs for any saved filters missing one (rows that predate the `slug` column). */
export async function backfillSavedFilterSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: savedFilters.id,
      name: savedFilters.name,
    })
    .from(savedFilters)
    .where(isNull(savedFilters.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const filter of missing) {
    const slug = uniqueSlug(filter.name, taken);
    taken.push(slug);
    await db.update(savedFilters).set({
      slug,
    }).where(eq(savedFilters.id, filter.id));
  }
}
