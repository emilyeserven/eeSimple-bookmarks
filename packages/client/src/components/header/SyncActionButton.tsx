import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useUiStore } from "@/stores/uiStore";

/**
 * Desktop header button that opens the outside-source Sync modal by flipping the store flag the
 * single {@link AppSyncModal} instance renders from (so the button, the mobile menu, and CMD+K all
 * share one modal).
 */
export function SyncActionButton() {
  const {
    t,
  } = useTranslation();
  const setSyncModalOpen = useUiStore(state => state.setSyncModalOpen);
  const syncFromSource = t("Sync from source");
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={syncFromSource}
      title={syncFromSource}
      onClick={() => setSyncModalOpen(true)}
    >
      <RefreshCw className="size-4" />
    </Button>
  );
}

/** Small-screen More-menu row that opens the Sync modal (same store flag as the desktop button). */
export function SyncActionMenuItem() {
  const {
    t,
  } = useTranslation();
  const setSyncModalOpen = useUiStore(state => state.setSyncModalOpen);
  return (
    <DropdownMenuItem onSelect={() => setSyncModalOpen(true)}>
      <RefreshCw className="size-4" />
      {t("Sync from source")}
    </DropdownMenuItem>
  );
}
