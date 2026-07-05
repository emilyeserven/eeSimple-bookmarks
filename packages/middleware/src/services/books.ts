import { and, asc, eq, isNull } from "drizzle-orm";
import type {
  Book,
  BulkDeleteResult,
  CreateBookInput,
  EntityName,
  UpdateBookInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { deleteTaxonomyImagesForOwner, mainTaxonomyImageUrl } from "@/services/taxonomyImages";
import { deleteEntityNamesForOwner, loadEntityNames } from "@/services/entityNames";
import { bookmarks, books, taxonomyImages, type BookRow } from "@/db/schema";
import { AppError } from "@/utils/errors";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing book name. */
export class DuplicateBookError extends AppError {
  constructor(name: string) {
    super(`A book named "${name}" already exists`, "duplicateName", 409, {
      entity: "book",
      name,
    });
  }
}

/** Map a DB row to the shared `Book` wire type. */
function toBook(
  row: BookRow & {
    bookmarkCount?: number;
    mainImage?: { id: string;
      createdAt: Date | string; } | null;
  },
  names?: EntityName[],
): Book {
  return {
    id: row.id,
    name: row.name,
    names: names ?? [],
    slug: row.slug ?? slugify(row.name),
    sortOrder: row.sortOrder,
    mediaPropertyId: row.mediaPropertyId ?? null,
    kavitaSeriesId: row.kavitaSeriesId ?? null,
    kavitaLibraryId: row.kavitaLibraryId ?? null,
    kavitaSeriesName: row.kavitaSeriesName ?? null,
    isbn: row.isbn ?? null,
    releaseYear: row.releaseYear ?? null,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: row.bookmarkCount,
    imageUrl: mainTaxonomyImageUrl(row.mainImage ?? null),
  };
}

/** Existing book slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(books, books.slug, books.id, excludeId);

/** The Kavita/media-property columns settable on create and patchable on update. */
type BookDataColumns = Pick<
  BookRow,
  "mediaPropertyId" | "kavitaSeriesId" | "kavitaLibraryId" | "kavitaSeriesName" | "isbn" | "releaseYear"
>;

/** Build the settable data columns from an input, treating missing keys as "leave"/null. */
function dataFromInput(input: CreateBookInput | UpdateBookInput): Partial<BookDataColumns> {
  const patch: Partial<BookDataColumns> = {};
  if (input.mediaPropertyId !== undefined) patch.mediaPropertyId = input.mediaPropertyId ?? null;
  if (input.kavitaSeriesId !== undefined) patch.kavitaSeriesId = input.kavitaSeriesId ?? null;
  if (input.kavitaLibraryId !== undefined) patch.kavitaLibraryId = input.kavitaLibraryId ?? null;
  if (input.kavitaSeriesName !== undefined) patch.kavitaSeriesName = input.kavitaSeriesName ?? null;
  if (input.isbn !== undefined) patch.isbn = input.isbn ?? null;
  if (input.releaseYear !== undefined) patch.releaseYear = input.releaseYear ?? null;
  return patch;
}

/** List all books, ordered by sort order then name, each with its bookmark count. */
export async function listBooks(): Promise<Book[]> {
  const rows = await db
    .select({
      id: books.id,
      name: books.name,
      slug: books.slug,
      sortOrder: books.sortOrder,
      mediaPropertyId: books.mediaPropertyId,
      kavitaSeriesId: books.kavitaSeriesId,
      kavitaLibraryId: books.kavitaLibraryId,
      kavitaSeriesName: books.kavitaSeriesName,
      isbn: books.isbn,
      releaseYear: books.releaseYear,
      createdAt: books.createdAt,
      bookmarkCount: db.$count(bookmarks, eq(bookmarks.bookId, books.id)),
      mainImage: {
        id: taxonomyImages.id,
        createdAt: taxonomyImages.createdAt,
      },
    })
    .from(books)
    .leftJoin(
      taxonomyImages,
      and(
        eq(taxonomyImages.ownerType, "book"),
        eq(taxonomyImages.ownerId, books.id),
        eq(taxonomyImages.isMain, true),
      ),
    )
    .orderBy(asc(books.sortOrder), asc(books.name));
  const namesMap = await loadEntityNames("book", rows.map(row => row.id));
  return rows.map(row => toBook({
    ...row,
    mainImage: row.mainImage?.id ? row.mainImage : null,
  }, namesMap.get(row.id)));
}

/** Add a book. Throws `DuplicateBookError` on a name clash. */
export async function createBook(input: CreateBookInput): Promise<Book> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateBookError(input.name);

  const [clash] = await db.select({
    id: books.id,
  }).from(books).where(eq(books.name, name));
  if (clash) throw new DuplicateBookError(name);

  const slug = uniqueSlug(name, await takenSlugs(), "book");
  const [row] = await db.insert(books).values({
    name,
    slug,
    sortOrder: input.sortOrder ?? 0,
    ...dataFromInput(input),
  }).returning();
  return toBook(row);
}

/** Update a book (rename, reorder, re-link Kavita/media property). Throws on a name clash. */
export async function updateBook(id: string, input: UpdateBookInput): Promise<Book | null> {
  const [existing] = await db.select().from(books).where(eq(books.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<BookRow, "name" | "slug" | "sortOrder">> & Partial<BookDataColumns> = {
    ...dataFromInput(input),
  };
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: books.id,
    }).from(books).where(eq(books.name, name));
    if (clash && clash.id !== id) throw new DuplicateBookError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id), "book");
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) {
    const namesMap = await loadEntityNames("book", [id]);
    return toBook(existing, namesMap.get(id));
  }

  const [row] = await db.update(books).set(patch).where(eq(books.id, id)).returning();
  if (!row) return null;
  const namesMap = await loadEntityNames("book", [id]);
  return toBook(row, namesMap.get(id));
}

/** Delete a book. The `set null` FK unlinks any bookmarks pointing at it. */
export async function deleteBook(id: string): Promise<boolean> {
  const rows = await db.delete(books).where(eq(books.id, id)).returning({
    id: books.id,
  });
  if (rows.length > 0) {
    await deleteTaxonomyImagesForOwner("book", id);
    await deleteEntityNamesForOwner("book", id);
  }
  return rows.length > 0;
}

/** Delete many books, reporting per-item outcomes. */
export function bulkDeleteBooks(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteBook);
}

/** Fill in slugs for any books missing one (e.g. rows that predate the `slug` column). */
export async function backfillBookSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: books.id,
      name: books.name,
    })
    .from(books)
    .where(isNull(books.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const book of missing) {
    const slug = uniqueSlug(book.name, taken, "book");
    taken.push(slug);
    await db.update(books).set({
      slug,
    }).where(eq(books.id, book.id));
  }
}

/**
 * Resolve the effective Kavita series id for a bookmark: the linked Book's `kavitaSeriesId` when a
 * book is linked and carries one, else the bookmark's legacy `kavitaSeriesId`. Returns null when
 * neither is available.
 */
export async function resolveBookmarkKavitaSeriesId(
  bookId: string | null,
  legacySeriesId: number | null,
): Promise<number | null> {
  if (bookId) {
    const [book] = await db.select({
      kavitaSeriesId: books.kavitaSeriesId,
    }).from(books).where(eq(books.id, bookId));
    if (book?.kavitaSeriesId != null) return book.kavitaSeriesId;
  }
  return legacySeriesId ?? null;
}
