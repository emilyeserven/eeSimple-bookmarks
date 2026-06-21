import { ne } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";

/**
 * Collect the non-null slugs already in use on a taxonomy table, optionally excluding one row (when
 * renaming it). Shared by the slug-routed taxonomy services so they don't each re-implement the same
 * `select slug … where id != excludeId` query.
 */
export async function takenSlugsOf(
  table: PgTable,
  slugColumn: PgColumn,
  idColumn: PgColumn,
  excludeId?: string,
): Promise<string[]> {
  const rows = await db
    .select({
      slug: slugColumn,
    })
    .from(table)
    .where(excludeId ? ne(idColumn, excludeId) : undefined);
  return rows.map(r => r.slug).filter((s): s is string => typeof s === "string");
}
