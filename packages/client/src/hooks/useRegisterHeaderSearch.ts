import { useEffect } from "react";

import { useUiStore } from "../stores/uiStore";

/** Registers the current page as wanting a header search bar. Clears the search query on unmount. */
export function useRegisterHeaderSearch() {
  const setHeaderSearchActive = useUiStore(state => state.setHeaderSearchActive);
  const setHeaderSearchQuery = useUiStore(state => state.setHeaderSearchQuery);
  useEffect(() => {
    setHeaderSearchActive(true);
    return () => {
      setHeaderSearchActive(false);
      setHeaderSearchQuery("");
    };
  }, [setHeaderSearchActive, setHeaderSearchQuery]);
}
