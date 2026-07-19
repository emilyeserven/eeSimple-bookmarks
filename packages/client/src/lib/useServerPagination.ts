import type { ServerPageWindow } from "./serverPagination";

import { useEffect, useState } from "react";

import { resolveServerPage } from "./serverPagination";

export interface ServerPaginationState {
  /** The requested 1-indexed page (clamping against the server total happens in {@link useClampedPageWindow}). */
  page: number;
  /** 0-based index of the first item to request for the current page. */
  offset: number;
  setPage: (page: number) => void;
}

/**
 * Page state for a server-paginated list: resets to page 1 whenever `resetKey` changes (filters,
 * search text, page key). The returned `offset` drives the server slice; pair with
 * {@link useClampedPageWindow} once the response's total is known. Sibling of
 * `useListingPagination` (the in-memory slicer, still used by the non-bookmark listings).
 */
export function useServerPagination(perPage: number, resetKey: string): ServerPaginationState {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const size = Math.max(1, Math.floor(perPage));
  return {
    page,
    offset: (page - 1) * size,
    setPage,
  };
}

/**
 * The display window for the current page against a server-reported `total`, snapping the stored
 * page down when the total shrinks below it (e.g. a delete removed the last page). While the total
 * is still unknown (first load) the requested page is shown as-is.
 */
export function useClampedPageWindow(
  state: ServerPaginationState,
  total: number | undefined,
  perPage: number,
): ServerPageWindow {
  const {
    page, setPage,
  } = state;
  const window = resolveServerPage(page, total, perPage);

  useEffect(() => {
    if (total !== undefined && window.page !== page) setPage(window.page);
  }, [total, window.page, page, setPage]);

  return window;
}
