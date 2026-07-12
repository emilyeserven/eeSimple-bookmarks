import { useEffect } from "react";

import { useUiStore } from "../stores/uiStore";

/**
 * Registers the current listing page (by its selection pageKey) as supporting bulk multi-select, so
 * the display-options box (`ListingSearchBox`) and the CMD+K palette show the Select toggle. Clears on
 * unmount. Pass `enabled: false` to opt a listing out of the toggle entirely.
 */
export function useRegisterBulkSelect(pageKey: string, enabled = true) {
  const setBulkSelectPageKey = useUiStore(state => state.setBulkSelectPageKey);
  useEffect(() => {
    if (!enabled) return;
    setBulkSelectPageKey(pageKey);
    return () => setBulkSelectPageKey(null);
  }, [pageKey, enabled, setBulkSelectPageKey]);
}
