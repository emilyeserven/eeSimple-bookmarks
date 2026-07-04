import { asc, eq, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateMediaPropertyInput,
  MediaProperty,
  UpdateMediaPropertyInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { books, mediaProperties, type MediaPropertyRow } from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing media property name. */
export class DuplicateMediaPropertyError extends Error {
  constructor(name: string) {
    super(`A media property named "${name}" already exists`);
    this.name = "DuplicateMediaPropertyError";
  }
}

/** Map a DB row to the shared `MediaProperty` wire type. */
function toMediaProperty(
  row: MediaPropertyRow & { bookCount?: number },
): MediaProperty {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    sortOrder: row.sortOrder,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookCount: row.bookCount,
  };
}

/** Existing media-property slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(mediaProperties, mediaProperties.slug, mediaProperties.id, excludeId);

/** List all media properties, ordered by sort order then name. */
export async function listMediaProperties(): Promise<MediaProperty[]> {
  const rows = await db
    .select({
      id: mediaProperties.id,
      name: mediaProperties.name,
      slug: mediaProperties.slug,
      sortOrder: mediaProperties.sortOrder,
      createdAt: mediaProperties.createdAt,
      bookCount: db.$count(books, eq(books.mediaPropertyId, mediaProperties.id)),
    })
    .from(mediaProperties)
    .orderBy(asc(mediaProperties.sortOrder), asc(mediaProperties.name));
  return rows.map(toMediaProperty);
}

/** Add a media property. Throws `DuplicateMediaPropertyError` on a name clash. */
export async function createMediaProperty(input: CreateMediaPropertyInput): Promise<MediaProperty> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateMediaPropertyError(input.name);

  const [clash] = await db.select({
    id: mediaProperties.id,
  }).from(mediaProperties).where(eq(mediaProperties.name, name));
  if (clash) throw new DuplicateMediaPropertyError(name);

  const slug = uniqueSlug(name, await takenSlugs(), "media-property");
  const [row] = await db.insert(mediaProperties).values({
    name,
    slug,
    sortOrder: input.sortOrder ?? 0,
  }).returning();
  return toMediaProperty(row);
}

/** Update a media property's name and/or sort order. Throws `DuplicateMediaPropertyError` on clash. */
export async function updateMediaProperty(
  id: string,
  input: UpdateMediaPropertyInput,
): Promise<MediaProperty | null> {
  const [existing] = await db.select().from(mediaProperties).where(eq(mediaProperties.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<MediaPropertyRow, "name" | "slug" | "sortOrder">> = {};
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: mediaProperties.id,
    }).from(mediaProperties).where(eq(mediaProperties.name, name));
    if (clash && clash.id !== id) throw new DuplicateMediaPropertyError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id), "media-property");
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) return toMediaProperty(existing);

  const [row] = await db.update(mediaProperties).set(patch).where(eq(mediaProperties.id, id)).returning();
  return row ? toMediaProperty(row) : null;
}

/** Delete a media property. The `set null` FK un-groups any member books. */
export async function deleteMediaProperty(id: string): Promise<boolean> {
  const rows = await db.delete(mediaProperties).where(eq(mediaProperties.id, id)).returning({
    id: mediaProperties.id,
  });
  return rows.length > 0;
}

/** Delete many media properties, reporting per-item outcomes. */
export function bulkDeleteMediaProperties(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteMediaProperty);
}

/** Fill in slugs for any media properties missing one (e.g. rows that predate the `slug` column). */
export async function backfillMediaPropertySlugs(): Promise<void> {
  const missing = await db
    .select({
      id: mediaProperties.id,
      name: mediaProperties.name,
    })
    .from(mediaProperties)
    .where(isNull(mediaProperties.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const prop of missing) {
    const slug = uniqueSlug(prop.name, taken, "media-property");
    taken.push(slug);
    await db.update(mediaProperties).set({
      slug,
    }).where(eq(mediaProperties.id, prop.id));
  }
}
