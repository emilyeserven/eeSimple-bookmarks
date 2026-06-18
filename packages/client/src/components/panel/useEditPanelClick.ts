import type { DrawerContentType, DrawerMode } from "@/lib/drawerSearch";
import type { MouseEvent } from "react";

import { useCallback } from "react";

import { usePanelControls } from "./usePanelControls";

import { hasSidebarModifier } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/**
 * Returns a click handler for a navigation affordance. A normal click falls through to the
 * underlying `<Link>` (navigating to the full page), while holding the user's configured modifier
 * opens the item in the shared right-hand sidebar in `mode` instead. Spread onto the `<Link>` an
 * Edit button or a view row renders.
 */
function useOpenInPanelClick(mode: DrawerMode): (
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
      // Without the configured modifier, let the Link navigate to the full page.
      if (!hasSidebarModifier(event, modifier)) return;
      // Suppress navigation and any native modifier behavior (e.g. open-in-new-tab), open the panel.
      event.preventDefault();
      openItem(ct, id, mode);
    },
    [openItem, modifier, mode],
  );
}

/**
 * Click handler for an Edit affordance: holding the configured modifier opens the item in the
 * sidebar in edit mode instead of navigating to its full edit page.
 */
export function useEditPanelClick(): (
  event: MouseEvent,
  ct: DrawerContentType,
  id: string,
) => void {
  return useOpenInPanelClick("edit");
}

/**
 * Click handler for a view/navigation affordance (a listing row, title, or cross-reference link):
 * holding the configured modifier opens the item in the sidebar in view mode instead of navigating
 * to its full detail page.
 */
export function useViewPanelClick(): (
  event: MouseEvent,
  ct: DrawerContentType,
  id: string,
) => void {
  return useOpenInPanelClick("view");
}
