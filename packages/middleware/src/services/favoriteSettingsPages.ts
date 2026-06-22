import type { CreateFavoriteSettingsPageInput, FavoriteSettingsPage } from "@eesimple/types";
import type { FavoriteSettingsPageRow } from "@/db/schema";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { favoriteSettingsPages } from "@/db/schema";

function toFavoriteSettingsPage(row: FavoriteSettingsPageRow): FavoriteSettingsPage {
  return {
    id: row.id,
    path: row.path,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export async function listFavoriteSettingsPages(): Promise<FavoriteSettingsPage[]> {
  const rows = await db
    .select()
    .from(favoriteSettingsPages)
    .orderBy(asc(favoriteSettingsPages.sortOrder), asc(favoriteSettingsPages.createdAt));
  return rows.map(toFavoriteSettingsPage);
}

export async function createFavoriteSettingsPage(
  input: CreateFavoriteSettingsPageInput,
): Promise<FavoriteSettingsPage> {
  const [row] = await db
    .insert(favoriteSettingsPages)
    .values({
      path: input.path,
    })
    .returning();
  return toFavoriteSettingsPage(row);
}

export async function deleteFavoriteSettingsPage(id: string): Promise<boolean> {
  const result = await db
    .delete(favoriteSettingsPages)
    .where(eq(favoriteSettingsPages.id, id))
    .returning({
      id: favoriteSettingsPages.id,
    });
  return result.length > 0;
}
