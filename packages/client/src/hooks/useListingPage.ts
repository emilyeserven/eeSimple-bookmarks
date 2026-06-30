import type { MouseEvent as ReactMouseEvent } from "react";

import { useEffect, useRef } from "react";

import { useUiStore } from "../stores/uiStore";

/** Registers the current page as a listing page in uiStore so AppHeader can show the Options and Create buttons. Clears on unmount. */
export function useSetListingPage(
  key: string,
  showsImages = false,
  hasFilters = false,
  showsCards = false,
  createAction?: (event?: ReactMouseEvent) => void,
  hasSort = false,
) {
  const setListingPage = useUiStore(state => state.setListingPage);

  // Ref so the stable wrapper always delegates to the latest createAction without re-registering.
  const createActionRef = useRef(createAction);
  createActionRef.current = createAction;

  useEffect(() => {
    setListingPage({
      key,
      showsImages,
      hasFilters,
      hasSort,
      showsCards,
      // Forward the click event so a create handler can branch on the sidebar modifier (e.g. open
      // the right drawer instead of navigating). Handlers that take no args simply ignore it.
      createAction: createAction != null ? (event?: ReactMouseEvent) => createActionRef.current?.(event) : undefined,
    });
    return () => setListingPage(null);
  }, [key, showsImages, hasFilters, hasSort, showsCards, setListingPage]);
}
