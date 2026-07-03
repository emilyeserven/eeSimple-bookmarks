import { SyncFromSourceModal } from "@/components/SyncFromSourceModal";
import { useUiStore } from "@/stores/uiStore";

/**
 * Renders the single outside-source Sync modal at the app-header level, driven entirely by the store
 * (`syncProvider` + `syncModalOpen`). Mirrors `AppAddBookmarkModal`: the header Sync button, the
 * mobile More-menu item, and the CMD+K action all just flip `syncModalOpen`, so there's exactly one
 * modal instance regardless of which surface opened it.
 */
export function AppSyncModal() {
  const provider = useUiStore(state => state.syncProvider);
  const open = useUiStore(state => state.syncModalOpen);
  const setOpen = useUiStore(state => state.setSyncModalOpen);

  if (!provider) return null;
  return (
    <SyncFromSourceModal
      provider={provider}
      open={open}
      onOpenChange={setOpen}
    />
  );
}
