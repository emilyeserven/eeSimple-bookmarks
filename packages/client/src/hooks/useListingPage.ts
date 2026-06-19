import { useEffect, useRef } from "react";

import { useUiStore } from "../stores/uiStore";

/** Registers the current page as a listing page in uiStore so AppHeader can show the Options and Create buttons. Clears on unmount. */
export function useSetListingPage(
  key: string,
  showsImages = false,
  hasFilters = false,
  showsCards = false,
  createAction?: () => void,
) {
  const setListingPage = useUiStore(state => state.setListingPage);

  // Keep a ref so the stable wrapper below always calls the latest version of createAction
  // without adding it to the effect dependency array (avoids re-registering on every render
  // when callers pass an inline arrow function).
  const createActionRef = useRef(createAction);
  createActionRef.current = createAction;

  useEffect(() => {
    setListingPage({
      key,
      showsImages,
      hasFilters,
      showsCards,
      createAction: createAction != null ? () => createActionRef.current?.() : undefined,
    });
    return () => setListingPage(null);
  // createAction is intentionally excluded — the ref handles updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, showsImages, hasFilters, showsCards, setListingPage]);
}
