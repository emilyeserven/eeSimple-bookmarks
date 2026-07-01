import { useEffect, useState } from "react";

export interface ListingPagination<T> {
  /** The clamped 1-indexed current page. */
  page: number;
  /** Total number of pages (at least 1). */
  totalPages: number;
  /** The items belonging to the current page. */
  pageItems: T[];
  /** Total item count across all pages. */
  total: number;
  /** 1-indexed index of the first item shown on the current page (0 when empty). */
  rangeStart: number;
  /** 1-indexed index of the last item shown on the current page (0 when empty). */
  rangeEnd: number;
  setPage: (page: number) => void;
}

/**
 * Client-side pagination over an in-memory list. Slices `items` into pages of `perPage`, clamping
 * the current page to the valid range, and resets to page 1 whenever `resetKey` changes (e.g. the
 * active filters or sort). Reference consumer: the bookmark listing pane.
 */
export function useListingPagination<T>(
  items: T[],
  perPage: number,
  resetKey: string,
): ListingPagination<T> {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const size = Math.max(1, Math.floor(perPage));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * size;
  const pageItems = items.slice(start, start + size);

  return {
    page: currentPage,
    totalPages,
    pageItems,
    total,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: start + pageItems.length,
    setPage,
  };
}
