import { useEffect } from "react";

import { useUiStore } from "../stores/uiStore";

/** Registers the current listing page (by its selection pageKey) as supporting bulk multi-select, so AppHeader shows the Select toggle. Clears on unmount. */
export function useRegisterBulkSelect(pageKey: string) {
  const setBulkSelectPageKey = useUiStore(state => state.setBulkSelectPageKey);
  useEffect(() => {
    setBulkSelectPageKey(pageKey);
    return () => setBulkSelectPageKey(null);
  }, [pageKey, setBulkSelectPageKey]);
}
