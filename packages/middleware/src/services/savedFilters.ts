import { asc, eq } from "drizzle-orm";
import type {
  Bookmark,
  BookmarkSearch,
  BulkDeleteResult,
  CreateSavedFilterInput,
  SavedFilter,
  TagDescendants,
  UpdateSavedFilterInput,
} from "@eesimple/types";
import { bookmarkMatchesSearch, validateBookmarkSearch } from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { savedFilters, type SavedFilterRow } from "@/db/schema";
import { getBookmarkEvaluationData } from "@/services/bookmarkCache";
import { hydrateBookmarkRows } from "@/services/bookmarkHydration";
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
    isFavorite: row.isFavorite,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(savedFilters, savedFilters.slug, savedFilters.id, excludeId);

/**
 * Whether a bookmark passes the tag-*inclusion* filter, expanded to each tag's whole subtree —
 * mirrors `searchBookmarks`' `passesTagInclusion` (the shared facet table deliberately leaves
 * inclusion to the data source); presence/exclude stay inside `bookmarkMatchesSearch`.
 */
function passesTagInclusion(
  bookmark: Bookmark,
  search: BookmarkSearch,
  tagDescendants: TagDescendants,
): boolean {
  if (!search.tags || search.tags.length === 0 || search.tagPresence === "exclude") return true;
  const allowed = new Set<string>();
  for (const id of search.tags) {
    for (const descendantId of tagDescendants(id)) allowed.add(descendantId);
  }
  return bookmark.tags.some(tag => allowed.has(tag.id));
}

/**
 * Count the hydrated bookmarks matching one saved filter's serialized search, via the exact same
 * shared `@eesimple/types` predicates the listing search runs — never a re-implementation. Pure,
 * exported for tests.
 */
export function countBookmarksMatchingFilter(
  filters: Record<string, unknown>,
  bookmarks: Bookmark[],
  tagDescendants: TagDescendants,
): number {
  const search = validateBookmarkSearch(filters);
  let count = 0;
  for (const bookmark of bookmarks) {
    if (passesTagInclusion(bookmark, search, tagDescendants) && bookmarkMatchesSearch(bookmark, search)) {
      count += 1;
    }
  }
  return count;
}

/**
 * List saved filters, each carrying its current `bookmarkCount` — the "load once → evaluate the
 * shared predicate in-memory" pattern (CLAUDE.md → "Data shaping", mirrors
 * `listHomepageSectionBookmarks`). Counts are display-only: this read never touches
 * `invalidateBookmarkCache()`.
 */
export async function listSavedFilters(): Promise<SavedFilter[]> {
  const rows = await db
    .select()
    .from(savedFilters)
    .orderBy(asc(savedFilters.name));
  const filters = rows.map(toSavedFilter);
  if (filters.length === 0) return filters;

  const {
    baseRows, tagDescendants,
  } = await getBookmarkEvaluationData();
  const hydrated = baseRows.length > 0 ? await hydrateBookmarkRows(baseRows) : [];
  return filters.map(filter => ({
    ...filter,
    bookmarkCount: countBookmarksMatchingFilter(filter.filters, hydrated, tagDescendants),
  }));
}

export async function getSavedFilterById(id: string): Promise<SavedFilter | null> {
  const [row] = await db
    .select()
    .from(savedFilters)
    .where(eq(savedFilters.id, id));
  return row ? toSavedFilter(row) : null;
}

export async function createSavedFilter(input: CreateSavedFilterInput): Promise<SavedFilter> {
  const slug = uniqueSlug(input.name, await takenSlugs(), "saved-filter");
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
    updates.slug = uniqueSlug(input.name, await takenSlugs(id), "saved-filter");
  }
  if (input.description !== undefined) updates.description = input.description ?? null;
  if (input.filters !== undefined) updates.filters = input.filters;
  if (input.viewableOnline !== undefined) updates.viewableOnline = input.viewableOnline;
  if (input.isFavorite !== undefined) updates.isFavorite = input.isFavorite;

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
