import type { DrawerContentType } from "@/lib/drawerSearch";
import type { MouseEvent } from "react";

import { useCallback } from "react";

import { usePanelControls } from "@/components/panel/usePanelControls";
import { hasSidebarModifier } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/**
 * Click handler for a Table-view row. Mirrors `useViewPanelClick`: holding the configured sidebar
 * modifier opens the item in the right-hand panel in view mode; otherwise the supplied
 * `navigateToPage` callback runs (a typed router `navigate(...)` to the item's full page). Passing
 * navigation as a callback keeps TanStack Router's route/param typing at the call site.
 */
export function useTableRowNav(): (
  event: MouseEvent,
  ct: DrawerContentType,
  id: string,
  navigateToPage: () => void,
) => void {
  const {
    openItem,
  } = usePanelControls();
  const modifier = useUiStore(state => state.sidebarOpenModifier);

  return useCallback(
    (event, ct, id, navigateToPage) => {
      if (hasSidebarModifier(event, modifier)) {
        event.preventDefault();
        openItem(ct, id, "view");
        return;
      }
      navigateToPage();
    },
    [openItem, modifier],
  );
}
