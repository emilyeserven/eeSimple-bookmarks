import { asc, count, eq, isNull } from "drizzle-orm";
import type { Author, CreateAuthorInput, UpdateAuthorInput } from "@eesimple/types";
import { db } from "@/db";
import { authorImages, authors, bookmarkAuthors, type AuthorRow } from "@/db/schema";
import { getAuthorImageRow } from "@/services/authorImages";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing author name. */
export class DuplicateAuthorError extends Error {
  constructor(name: string) {
    super(`An author named "${name}" already exists`);
    this.name = "DuplicateAuthorError";
  }
}

function avatarUrlFrom(authorId: string, createdAt: Date | string | null): string | null {
  if (!createdAt) return null;
  const time = (createdAt instanceof Date ? createdAt : new Date(createdAt)).getTime();
  return `/api/authors/${authorId}/image?v=${time}`;
}

/** Map a DB row to the shared `Author` wire type. */
function toAuthor(
  row: AuthorRow & { avatarCreatedAt?: Date | string | null },
  bookmarkCount?: number,
): Author {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount,
    authorWebsiteUrl: row.authorWebsiteUrl ?? null,
    biographyUrl: row.biographyUrl ?? null,
    imageUrl: avatarUrlFrom(row.id, row.avatarCreatedAt ?? null),
  };
}

/** Existing author slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(authors, authors.slug, authors.id, excludeId);

/** List all authors, ordered by name, with bookmark counts. */
export async function listAuthors(): Promise<Author[]> {
  const rows = await db
    .select({
      id: authors.id,
      name: authors.name,
      slug: authors.slug,
      authorWebsiteUrl: authors.authorWebsiteUrl,
      biographyUrl: authors.biographyUrl,
      createdAt: authors.createdAt,
      avatarCreatedAt: authorImages.createdAt,
    })
    .from(authors)
    .leftJoin(authorImages, eq(authorImages.authorId, authors.id))
    .orderBy(asc(authors.name));

  const counts = await db
    .select({
      authorId: bookmarkAuthors.authorId,
      count: count(),
    })
    .from(bookmarkAuthors)
    .groupBy(bookmarkAuthors.authorId);
  const countMap = new Map(counts.map(c => [c.authorId, Number(c.count)]));
  return rows.map(row => toAuthor(row, countMap.get(row.id) ?? 0));
}

/** Add a new author. Throws `DuplicateAuthorError` on a name clash. */
export async function createAuthor(input: CreateAuthorInput): Promise<Author> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateAuthorError(input.name);

  const [clash] = await db.select({
    id: authors.id,
  }).from(authors).where(eq(authors.name, name));
  if (clash) throw new DuplicateAuthorError(name);

  const slug = uniqueSlug(name, await takenSlugs());
  const [row] = await db.insert(authors).values({
    name,
    slug,
  }).returning();
  return toAuthor(row);
}

/** Update an author's name and/or URL fields. Throws `DuplicateAuthorError` on a name clash. */
export async function updateAuthor(id: string, input: UpdateAuthorInput): Promise<Author | null> {
  const [existing] = await db.select().from(authors).where(eq(authors.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<AuthorRow, "name" | "slug" | "authorWebsiteUrl" | "biographyUrl">> = {};
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: authors.id,
    }).from(authors).where(eq(authors.name, name));
    if (clash && clash.id !== id) throw new DuplicateAuthorError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id));
  }
  if ("authorWebsiteUrl" in input) patch.authorWebsiteUrl = input.authorWebsiteUrl ?? null;
  if ("biographyUrl" in input) patch.biographyUrl = input.biographyUrl ?? null;

  if (Object.keys(patch).length === 0) {
    const imageRow = await getAuthorImageRow(id);
    return toAuthor({
      ...existing,
      avatarCreatedAt: imageRow?.createdAt ?? null,
    });
  }

  const [row] = await db.update(authors).set(patch).where(eq(authors.id, id)).returning();
  if (!row) return null;
  const imageRow = await getAuthorImageRow(id);
  return toAuthor({
    ...row,
    avatarCreatedAt: imageRow?.createdAt ?? null,
  });
}

/** Delete an author. Bookmark join rows are removed via cascade. Returns false when not found. */
export async function deleteAuthor(id: string): Promise<boolean> {
  const rows = await db.delete(authors).where(eq(authors.id, id)).returning({
    id: authors.id,
  });
  return rows.length > 0;
}

/** Fill in slugs for any authors missing one (e.g. rows that predate the `slug` column). */
export async function backfillAuthorSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: authors.id,
      name: authors.name,
    })
    .from(authors)
    .where(isNull(authors.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const author of missing) {
    const slug = uniqueSlug(author.name, taken);
    taken.push(slug);
    await db.update(authors).set({
      slug,
    }).where(eq(authors.id, author.id));
  }
}
