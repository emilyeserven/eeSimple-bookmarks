/**
 * Pure page arithmetic for server-side pagination (the bookmark listing). Split from the
 * `useServerPagination` hook so the clamp/range rules are unit-testable in the node environment.
 */

export interface ServerPageWindow {
  /** The clamped 1-indexed current page. */
  page: number;
  /** Total number of pages (at least 1). */
  totalPages: number;
  /** 0-based index of the first item on the current page. */
  offset: number;
  /** 1-indexed index of the first item shown (0 when the set is empty). */
  rangeStart: number;
}

/**
 * Clamp `page` against a server-reported `total`. While the total is still unknown (first load),
 * the requested page is trusted so the query can fire; once known, an out-of-range page (e.g.
 * after a delete shrank the set) snaps to the last page.
 */
export function resolveServerPage(
  page: number,
  total: number | undefined,
  perPage: number,
): ServerPageWindow {
  const size = Math.max(1, Math.floor(perPage));
  const totalPages = total === undefined ? Math.max(1, page) : Math.max(1, Math.ceil(total / size));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const offset = (currentPage - 1) * size;
  return {
    page: currentPage,
    totalPages,
    offset,
    rangeStart: total === 0 ? 0 : offset + 1,
  };
}
