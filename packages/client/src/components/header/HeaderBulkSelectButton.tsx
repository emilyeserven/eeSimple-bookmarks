import { CheckSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/uiStore";

/** Toggle for a listing's bulk-selection mode, rendered in the display-options box. Flips `selectionMode[pageKey]`; the in-page bar handles the rest. */
export function HeaderBulkSelectButton({
  pageKey,
}: {
  pageKey: string;
}) {
  const {
    t,
  } = useTranslation();
  const mode = useUiStore(state => state.selectionMode[pageKey]) ?? false;
  const setSelectionMode = useUiStore(state => state.setSelectionMode);
  const label = mode ? t("Done selecting") : t("Select");
  return (
    <Button
      type="button"
      variant={mode ? "secondary" : "ghost"}
      size="icon"
      aria-label={label}
      aria-pressed={mode}
      title={label}
      onClick={() => setSelectionMode(pageKey, !mode)}
    >
      <CheckSquare className="size-4" />
    </Button>
  );
}
