import type { Bookmark, CreateBookInput, UpdateBookInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { booksApi } from "../lib/api/taxonomies";

const BOOKS_KEY = ["books"] as const;
const MEDIA_PROPERTIES_KEY = ["media-properties"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useBooks() {
  return useQuery({
    queryKey: BOOKS_KEY,
    queryFn: booksApi.list,
  });
}

/** Look up a single book by its slug from the cached list. */
export function useBookBySlug(slug: string) {
  const query = useBooks();
  return {
    ...query,
    book: (query.data ?? []).find(item => item.slug === slug),
  };
}

/** The Kavita linkage resolved for a bookmark's detail/deep-link display. */
export interface BookmarkKavitaLink {
  seriesId: number;
  libraryId: number | null;
  seriesName: string | null;
}

/**
 * The effective Kavita linkage for a bookmark: the linked Book's Kavita fields when a book is linked
 * and carries them, else the bookmark's legacy `kavitaSeriesId`/`kavitaLibraryId`/`kavitaSeriesName`.
 * Powers the cover / ToC import gates and the "View on Kavita" link-outs now that book selection
 * flows through the Books taxonomy (mirrors the middleware's `resolveBookmarkKavitaSeriesId`).
 * Returns `null` when neither is available.
 */
export function useBookmarkKavitaLink(bookmark: Bookmark): BookmarkKavitaLink | null {
  const {
    data,
  } = useBooks();
  const linkedBook = bookmark.bookId ? (data ?? []).find(item => item.id === bookmark.bookId) : undefined;
  const seriesId = linkedBook?.kavitaSeriesId ?? bookmark.kavitaSeriesId ?? null;
  if (seriesId === null) return null;
  return {
    seriesId,
    libraryId: linkedBook?.kavitaLibraryId ?? bookmark.kavitaLibraryId ?? null,
    seriesName: linkedBook?.kavitaSeriesName ?? bookmark.kavitaSeriesName ?? null,
  };
}

/**
 * The effective Kavita series id for a bookmark — the numeric-only projection of
 * {@link useBookmarkKavitaLink}. Powers the cover / ToC import gates.
 */
export function useBookmarkKavitaSeriesId(bookmark: Bookmark): number | null {
  return useBookmarkKavitaLink(bookmark)?.seriesId ?? null;
}

/** Invalidate every query whose rendering depends on book definitions. */
function useInvalidateBookConsumers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: BOOKS_KEY,
    });
    // A book's media-property link ripples into media-property book counts.
    void queryClient.invalidateQueries({
      queryKey: MEDIA_PROPERTIES_KEY,
    });
    // A book rename/delete surfaces on any bookmark linked to it.
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  };
}

export function useCreateBook() {
  const invalidate = useInvalidateBookConsumers();
  return useMutation({
    mutationFn: (input: CreateBookInput) => booksApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateBook() {
  const invalidate = useInvalidateBookConsumers();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateBookInput; }) => booksApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteBook() {
  const invalidate = useInvalidateBookConsumers();
  return useMutation({
    mutationFn: (id: string) => booksApi.remove(id),
    onSuccess: invalidate,
  });
}

export function useBulkDeleteBooks() {
  return useBulkDeleteEntity(booksApi.bulkDelete, useInvalidateBookConsumers());
}
