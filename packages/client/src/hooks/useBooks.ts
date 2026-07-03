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

/**
 * The effective Kavita series id for a bookmark: the linked Book's `kavitaSeriesId` when a book is
 * linked and carries one, else the bookmark's legacy `kavitaSeriesId`. Powers the cover / ToC
 * import gates now that book selection flows through the Books taxonomy (mirrors the middleware's
 * `resolveBookmarkKavitaSeriesId`). Returns `null` when neither is available.
 */
export function useBookmarkKavitaSeriesId(bookmark: Bookmark): number | null {
  const {
    data,
  } = useBooks();
  const linkedBook = bookmark.bookId ? (data ?? []).find(item => item.id === bookmark.bookId) : undefined;
  return linkedBook?.kavitaSeriesId ?? bookmark.kavitaSeriesId ?? null;
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
