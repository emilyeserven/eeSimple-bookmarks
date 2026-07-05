import { asc, eq, inArray } from "drizzle-orm";
import type { BulkDeleteResult, CreateNewsletterInput, Newsletter, UpdateNewsletterInput } from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { deleteGenreMoodAssignmentsForOwner } from "@/services/genreMoodAssignments";
import { bookmarks, categories, type NewsletterRow, newsletters, newsletterTags } from "@/db/schema";
import { AppError } from "@/utils/errors";
import { buildStringMap } from "@/utils/mapUtils";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing newsletter name. */
export class DuplicateNewsletterError extends AppError {
  constructor(name: string) {
    super(`A newsletter named "${name}" already exists`, "duplicateName", 409, {
      entity: "newsletter",
      name,
    });
  }
}

/** Load default tag ids for a set of newsletter ids as a map of id → string[]. */
async function loadNewsletterTagsMap(newsletterIds: string[]): Promise<Map<string, string[]>> {
  if (newsletterIds.length === 0) return new Map();
  const rows = await db
    .select({
      newsletterId: newsletterTags.newsletterId,
      tagId: newsletterTags.tagId,
    })
    .from(newsletterTags)
    .where(inArray(newsletterTags.newsletterId, newsletterIds));
  return buildStringMap(rows, r => r.newsletterId, r => r.tagId);
}

/** Replace the full set of default tags for a newsletter (delete-then-insert). */
async function setNewsletterTags(newsletterId: string, tagIds: string[]): Promise<void> {
  await db.delete(newsletterTags).where(eq(newsletterTags.newsletterId, newsletterId));
  if (tagIds.length > 0) {
    await db.insert(newsletterTags).values(tagIds.map(tagId => ({
      newsletterId,
      tagId,
    })));
  }
}

/** Map a DB row to the shared `Newsletter` wire type. */
function toNewsletter(
  row: NewsletterRow & {
    bookmarkCount?: number;
    categoryName?: string | null;
    categorySlug?: string | null;
    categoryIcon?: string | null;
  },
  tagIds: string[] = [],
): Newsletter {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: row.bookmarkCount,
    category: row.categoryId && row.categoryName
      ? {
        id: row.categoryId,
        name: row.categoryName,
        slug: row.categorySlug ?? slugify(row.categoryName),
        icon: row.categoryIcon ?? null,
      }
      : null,
    tagIds,
    mediaTypeId: row.mediaTypeId ?? null,
  };
}

/** Existing newsletter slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(newsletters, newsletters.slug, newsletters.id, excludeId);

/** Shared select shape for newsletter lookups (includes category join). */
const newsletterSelect = {
  id: newsletters.id,
  name: newsletters.name,
  slug: newsletters.slug,
  categoryId: newsletters.categoryId,
  mediaTypeId: newsletters.mediaTypeId,
  createdAt: newsletters.createdAt,
  categoryName: categories.name,
  categorySlug: categories.slug,
  categoryIcon: categories.icon,
};

/** List all newsletters, ordered by name, with bookmark counts + default tags. */
export async function listNewsletters(): Promise<Newsletter[]> {
  const rows = await db
    .select({
      ...newsletterSelect,
      bookmarkCount: db.$count(bookmarks, eq(bookmarks.newsletterId, newsletters.id)),
    })
    .from(newsletters)
    .leftJoin(categories, eq(categories.id, newsletters.categoryId))
    .orderBy(asc(newsletters.name));

  const tagsMap = await loadNewsletterTagsMap(rows.map(r => r.id));
  return rows.map(row => toNewsletter(row, tagsMap.get(row.id) ?? []));
}

/** Load default tags for a single newsletter row and map it to the wire type. */
async function hydrateNewsletterRow(row: Parameters<typeof toNewsletter>[0]): Promise<Newsletter> {
  const tagsMap = await loadNewsletterTagsMap([row.id]);
  return toNewsletter(row, tagsMap.get(row.id) ?? []);
}

/** Fetch a single newsletter by id, or `null` when absent. */
export async function getNewsletter(id: string): Promise<Newsletter | null> {
  const [row] = await db
    .select(newsletterSelect)
    .from(newsletters)
    .leftJoin(categories, eq(categories.id, newsletters.categoryId))
    .where(eq(newsletters.id, id));
  if (!row) return null;
  return hydrateNewsletterRow(row);
}

/** Create a newsletter by name. Throws `DuplicateNewsletterError` when the name already exists. */
export async function createNewsletter(input: CreateNewsletterInput): Promise<Newsletter> {
  const name = input.name.trim();
  const [clash] = await db.select({
    id: newsletters.id,
  }).from(newsletters).where(eq(newsletters.name, name));
  if (clash) throw new DuplicateNewsletterError(name);

  const slug = uniqueSlug(name, await takenSlugs(), "newsletter");
  const [row] = await db
    .insert(newsletters)
    .values({
      name,
      slug,
    })
    .returning({
      id: newsletters.id,
    });

  return (await getNewsletter(row.id))!;
}

/** Rename a newsletter and/or update its default category / tags / media type. */
export async function updateNewsletter(
  id: string,
  input: UpdateNewsletterInput,
): Promise<Newsletter | null> {
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length > 0) {
      const [clash] = await db.select({
        id: newsletters.id,
      }).from(newsletters).where(eq(newsletters.name, name));
      if (clash && clash.id !== id) throw new DuplicateNewsletterError(name);

      const slug = uniqueSlug(name, await takenSlugs(id), "newsletter");
      await db
        .update(newsletters)
        .set({
          name,
          slug,
        })
        .where(eq(newsletters.id, id));
    }
  }

  if ("categoryId" in input) {
    await db
      .update(newsletters)
      .set({
        categoryId: input.categoryId ?? null,
      })
      .where(eq(newsletters.id, id));
  }

  if ("mediaTypeId" in input) {
    await db
      .update(newsletters)
      .set({
        mediaTypeId: input.mediaTypeId ?? null,
      })
      .where(eq(newsletters.id, id));
  }

  if (input.tagIds !== undefined) {
    await setNewsletterTags(id, input.tagIds);
  }

  return getNewsletter(id);
}

/** Delete a newsletter. Bookmarks/imports pointing at it have their FK set to NULL. */
export async function deleteNewsletter(id: string): Promise<boolean> {
  const rows = await db.delete(newsletters).where(eq(newsletters.id, id)).returning({
    id: newsletters.id,
  });
  if (rows.length > 0) {
    // Genre/mood assignments key off (ownerType, ownerId) with no FK on ownerId, so clean them up here.
    await deleteGenreMoodAssignmentsForOwner("newsletter", id);
  }
  return rows.length > 0;
}

/** Delete many newsletters, reporting per-item outcomes. */
export function bulkDeleteNewsletters(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteNewsletter);
}

/** Resolve a newsletter's default category id, or `null` when absent/unset. */
export async function getNewsletterCategoryId(id: string): Promise<string | null> {
  const [row] = await db.select({
    categoryId: newsletters.categoryId,
  }).from(newsletters).where(eq(newsletters.id, id));
  return row?.categoryId ?? null;
}

/** Resolve a newsletter's default media type id, or `null` when absent/unset. */
export async function getNewsletterMediaTypeId(id: string): Promise<string | null> {
  const [row] = await db.select({
    mediaTypeId: newsletters.mediaTypeId,
  }).from(newsletters).where(eq(newsletters.id, id));
  return row?.mediaTypeId ?? null;
}

/** Resolve a newsletter's default tag ids. */
export async function getNewsletterTagIds(id: string): Promise<string[]> {
  const rows = await db.select({
    tagId: newsletterTags.tagId,
  }).from(newsletterTags).where(eq(newsletterTags.newsletterId, id));
  return rows.map(r => r.tagId);
}
