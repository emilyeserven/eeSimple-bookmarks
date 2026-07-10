import { useEffect } from "react";

import { useUiStore } from "../stores/uiStore";

/**
 * Registers the current listing page (by its selection pageKey) as supporting bulk multi-select, so
 * AppHeader (and the CMD+K palette) shows the Select toggle. Clears on unmount. Pass `enabled: false`
 * (e.g. `EntityListingConfig.hideBulkSelectFromHeader`) for a listing that renders its own inline
 * `HeaderBulkSelectButton` instead, so the toggle isn't offered in both places.
 */
export function useRegisterBulkSelect(pageKey: string, enabled = true) {
  const setBulkSelectPageKey = useUiStore(state => state.setBulkSelectPageKey);
  useEffect(() => {
    if (!enabled) return;
    setBulkSelectPageKey(pageKey);
    return () => setBulkSelectPageKey(null);
  }, [pageKey, enabled, setBulkSelectPageKey]);
}
