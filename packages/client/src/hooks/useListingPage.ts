import type { MouseEvent as ReactMouseEvent } from "react";

import { useEffect, useRef } from "react";

import { useUiStore } from "../stores/uiStore";

/**
 * Options controlling the header Plus button for a listing page.
 * - `addBookmark`: when present, the header Plus offers an "Add bookmark" action (opening the
 *   app-level modal); its optional `categoryId` locks the new bookmark to a category.
 * - `createLabel`: label for the entity-create option when the Plus becomes a dropdown.
 */
export interface ListingPageOptions {
  addBookmark?: { categoryId?: string };
  createLabel?: string;
}

/** Registers the current page as a listing page in uiStore so AppHeader can show the Options and Create buttons. Clears on unmount. */
export function useSetListingPage(
  key: string,
  showsImages = false,
  hasFilters = false,
  showsCards = false,
  createAction?: (event?: ReactMouseEvent) => void,
  hasSort = false,
  options?: ListingPageOptions,
) {
  const setListingPage = useUiStore(state => state.setListingPage);

  // Ref so the stable wrapper always delegates to the latest createAction without re-registering.
  const createActionRef = useRef(createAction);
  createActionRef.current = createAction;

  const addBookmarkCategoryId = options?.addBookmark?.categoryId;
  const hasAddBookmark = options?.addBookmark != null;
  const createLabel = options?.createLabel;

  useEffect(() => {
    // Exactly one surface (usually the route) may register a listing page: React runs cleanups
    // before the next registration on navigation and dep changes, so a live registration here means
    // two components are competing and the later one clobbers the first's create/filter affordances.
    if (import.meta.env.DEV) {
      const live = useUiStore.getState().listingPage;
      if (live !== null) {
        console.warn(
          `useSetListingPage("${key}"): "${live.key}" is already registered. Register once per `
          + "page — usually in the route, not the manager component.",
        );
      }
    }
    setListingPage({
      key,
      showsImages,
      hasFilters,
      hasSort,
      showsCards,
      // Forward the click event so a create handler can branch on the sidebar modifier (e.g. open
      // the right drawer instead of navigating). Handlers that take no args simply ignore it.
      createAction: createAction != null ? (event?: ReactMouseEvent) => createActionRef.current?.(event) : undefined,
      addBookmark: hasAddBookmark
        ? {
          categoryId: addBookmarkCategoryId,
        }
        : undefined,
      createLabel,
    });
    return () => setListingPage(null);
  }, [key, showsImages, hasFilters, hasSort, showsCards, hasAddBookmark, addBookmarkCategoryId, createLabel, setListingPage]);
}
