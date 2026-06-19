import { asc, eq, isNull, ne } from "drizzle-orm";
import type { CreateMediaTypeInput, MediaType, UpdateMediaTypeInput } from "@eesimple/types";
import { db } from "@/db";
import { bookmarks, mediaTypes, type MediaTypeRow } from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";

/** Thrown when a create/rename collides with an existing media type name. */
export class DuplicateMediaTypeError extends Error {
  constructor(name: string) {
    super(`A media type named "${name}" already exists`);
    this.name = "DuplicateMediaTypeError";
  }
}

/** Thrown when an update or delete targets a built-in media type in a disallowed way. */
export class BuiltInMediaTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BuiltInMediaTypeError";
  }
}

/** The seeded built-in vocabulary, in display order. */
const BUILT_IN_MEDIA_TYPES = ["Video", "Article", "Podcast", "Audio", "Image", "Document", "Other"];

/** Map a DB row to the shared `MediaType` wire type. */
function toMediaType(row: MediaTypeRow & { bookmarkCount?: number }): MediaType {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    icon: row.icon ?? null,
    builtIn: row.builtIn,
    sortOrder: row.sortOrder,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: row.bookmarkCount,
  };
}

/** Existing media-type slugs, optionally excluding one row (when renaming). */
async function takenSlugs(excludeId?: string): Promise<string[]> {
  const rows = await db
    .select({
      slug: mediaTypes.slug,
    })
    .from(mediaTypes)
    .where(excludeId ? ne(mediaTypes.id, excludeId) : undefined);
  return rows.map(r => r.slug).filter((s): s is string => s !== null);
}

/** List all media types, ordered by their display order then name. */
export async function listMediaTypes(): Promise<MediaType[]> {
  const rows = await db
    .select({
      id: mediaTypes.id,
      name: mediaTypes.name,
      slug: mediaTypes.slug,
      icon: mediaTypes.icon,
      builtIn: mediaTypes.builtIn,
      sortOrder: mediaTypes.sortOrder,
      createdAt: mediaTypes.createdAt,
      bookmarkCount: db.$count(bookmarks, eq(bookmarks.mediaTypeId, mediaTypes.id)),
    })
    .from(mediaTypes)
    .orderBy(asc(mediaTypes.sortOrder), asc(mediaTypes.name));
  return rows.map(toMediaType);
}

/** Fetch a media type by its slug, or `null` when absent. */
export async function getMediaTypeBySlug(slug: string): Promise<MediaType | null> {
  const [row] = await db.select().from(mediaTypes).where(eq(mediaTypes.slug, slug));
  return row ? toMediaType(row) : null;
}

/** Add a custom media type. Throws `DuplicateMediaTypeError` on a name clash. */
export async function createMediaType(input: CreateMediaTypeInput): Promise<MediaType> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateMediaTypeError(input.name);

  const [clash] = await db.select({
    id: mediaTypes.id,
  }).from(mediaTypes).where(eq(mediaTypes.name, name));
  if (clash) throw new DuplicateMediaTypeError(name);

  const slug = uniqueSlug(name, await takenSlugs());
  const [row] = await db.insert(mediaTypes).values({
    name,
    slug,
    icon: input.icon ?? null,
    sortOrder: input.sortOrder ?? BUILT_IN_MEDIA_TYPES.length,
  }).returning();
  return toMediaType(row);
}

/** Rename and/or reorder a media type. Built-ins cannot be renamed. */
export async function updateMediaType(
  id: string,
  input: UpdateMediaTypeInput,
): Promise<MediaType | null> {
  const [existing] = await db.select().from(mediaTypes).where(eq(mediaTypes.id, id));
  if (!existing) return null;
  if (existing.builtIn && input.name !== undefined && input.name.trim() !== existing.name) {
    throw new BuiltInMediaTypeError("A built-in media type cannot be renamed");
  }

  const patch: Partial<Pick<MediaTypeRow, "name" | "slug" | "sortOrder" | "icon">> = {};
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: mediaTypes.id,
    }).from(mediaTypes).where(eq(mediaTypes.name, name));
    if (clash && clash.id !== id) throw new DuplicateMediaTypeError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id));
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (input.icon !== undefined) patch.icon = input.icon;
  if (Object.keys(patch).length === 0) return toMediaType(existing);

  const [row] = await db.update(mediaTypes).set(patch).where(eq(mediaTypes.id, id)).returning();
  return row ? toMediaType(row) : null;
}

/** Delete a media type. Built-ins cannot be deleted. Bookmarks pointing at it are set to NULL. */
export async function deleteMediaType(id: string): Promise<boolean> {
  const [existing] = await db.select({
    builtIn: mediaTypes.builtIn,
  }).from(mediaTypes).where(eq(mediaTypes.id, id));
  if (!existing) return false;
  if (existing.builtIn) throw new BuiltInMediaTypeError("A built-in media type cannot be deleted");
  const rows = await db.delete(mediaTypes).where(eq(mediaTypes.id, id)).returning({
    id: mediaTypes.id,
  });
  return rows.length > 0;
}

/**
 * Ensure the seeded built-in media types exist. Idempotent and safe to call at boot: inserts any
 * missing built-in by slug, preserving its display order.
 */
export async function ensureBuiltInMediaTypes(): Promise<void> {
  for (const [index, name] of BUILT_IN_MEDIA_TYPES.entries()) {
    const slug = slugify(name);
    await db
      .insert(mediaTypes)
      .values({
        name,
        slug,
        builtIn: true,
        sortOrder: index,
      })
      .onConflictDoNothing({
        target: mediaTypes.slug,
      });
  }
}

/** Fill in slugs for any media types missing one (e.g. rows that predate the `slug` column). */
export async function backfillMediaTypeSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: mediaTypes.id,
      name: mediaTypes.name,
    })
    .from(mediaTypes)
    .where(isNull(mediaTypes.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const mt of missing) {
    const slug = uniqueSlug(mt.name, taken);
    taken.push(slug);
    await db.update(mediaTypes).set({
      slug,
    }).where(eq(mediaTypes.id, mt.id));
  }
}
