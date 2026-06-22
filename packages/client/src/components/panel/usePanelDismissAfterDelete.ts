import { usePanelControls } from "./usePanelControls";

import { useIsMobile } from "@/hooks/use-mobile";
import { usePanelPinned } from "@/hooks/useAppSettings";

/**
 * Returns the callback to run after an item is deleted from the shared right panel. It mirrors
 * `RightPanel`'s `docked = pinned && !isMobile` rule: when the panel is docked it falls back to the
 * current content type's list (e.g. all bookmarks); otherwise it closes the floating drawer.
 */
export function usePanelDismissAfterDelete(): () => void {
  const {
    dCT, openType, close,
  } = usePanelControls();
  const pinned = usePanelPinned();
  const isMobile = useIsMobile();

  return () => {
    if (pinned && !isMobile && dCT) {
      openType(dCT);
    }
    else {
      close();
    }
  };
}
