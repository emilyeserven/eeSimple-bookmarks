import { asc, eq } from "drizzle-orm";
import type {
  CreateSavedFilterInput,
  SavedFilter,
  UpdateSavedFilterInput,
} from "@eesimple/types";
import { db } from "@/db";
import { savedFilters, type SavedFilterRow } from "@/db/schema";

function toSavedFilter(row: SavedFilterRow): SavedFilter {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    filters: row.filters,
    viewableOnline: row.viewableOnline,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

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

export async function createSavedFilter(input: CreateSavedFilterInput): Promise<SavedFilter> {
  const [row] = await db
    .insert(savedFilters)
    .values({
      name: input.name,
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
  if (input.name !== undefined) updates.name = input.name;
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
