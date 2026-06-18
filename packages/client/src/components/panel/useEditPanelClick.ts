import type { DrawerContentType } from "@/lib/drawerSearch";
import type { MouseEvent } from "react";

import { useCallback } from "react";

import { usePanelControls } from "./usePanelControls";

import { hasSidebarModifier } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/**
 * Returns a click handler for an Edit affordance. A normal click falls through to the underlying
 * `<Link>` (navigating to the full edit page), while holding the user's configured modifier opens
 * the item in the shared right-hand sidebar in edit mode instead. Spread onto the `<Link>` an Edit
 * button renders.
 */
export function useEditPanelClick(): (
  event: MouseEvent,
  ct: DrawerContentType,
  id: string,
) => void {
  const {
    openItem,
  } = usePanelControls();
  const modifier = useUiStore(state => state.sidebarOpenModifier);

  return useCallback(
    (event: MouseEvent, ct: DrawerContentType, id: string) => {
      // Without the configured modifier, let the Link navigate to the full edit page.
      if (!hasSidebarModifier(event, modifier)) return;
      // Suppress navigation and any native modifier behavior (e.g. open-in-new-tab), open the panel.
      event.preventDefault();
      openItem(ct, id, "edit");
    },
    [openItem, modifier],
  );
}
