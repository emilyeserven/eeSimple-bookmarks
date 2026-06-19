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

  // Ref so the stable wrapper always delegates to the latest createAction without re-registering.
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
  }, [key, showsImages, hasFilters, showsCards, setListingPage]);
}
