import { useEffect } from "react";

import { useUiStore } from "../stores/uiStore";

/** Registers the current page as a listing page in uiStore so AppHeader can show the Options button. Clears on unmount. */
export function useSetListingPage(key: string, showsImages = false, hasFilters = false, showsCards = false) {
  const setListingPage = useUiStore(state => state.setListingPage);
  useEffect(() => {
    setListingPage({
      key,
      showsImages,
      hasFilters,
      showsCards,
    });
    return () => setListingPage(null);
  }, [key, showsImages, hasFilters, showsCards, setListingPage]);
}
