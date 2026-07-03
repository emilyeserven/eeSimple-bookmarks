import type { SyncProvider } from "../lib/syncSources/syncSourceTypes";

import { useEffect } from "react";

import { useUiStore } from "../stores/uiStore";

/**
 * Registers a mounted edit form's {@link SyncProvider} so the AppHeader shows the "Sync from source"
 * button and the sync modal can fetch/apply against it. Clears on unmount. Mirrors
 * {@link useRegisterBulkSelect}. Pass `null` to register nothing (e.g. while the entity has no linked
 * source), keeping the button hidden.
 */
export function useRegisterSyncProvider(provider: SyncProvider | null) {
  const setSyncProvider = useUiStore(state => state.setSyncProvider);
  const setSyncModalOpen = useUiStore(state => state.setSyncModalOpen);
  useEffect(() => {
    setSyncProvider(provider);
    // Closing the modal on unmount keeps its open flag from leaking to the next entity's provider.
    return () => {
      setSyncProvider(null);
      setSyncModalOpen(false);
    };
  }, [provider, setSyncProvider, setSyncModalOpen]);
}
