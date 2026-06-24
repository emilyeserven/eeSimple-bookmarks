import type { DrawerContentType } from "@/lib/drawerSearch";
import type { MouseEvent } from "react";

import { useCallback } from "react";

import { useSidebarOpenModifier } from "../../hooks/useAppSettings";

import { usePanelControls } from "@/components/panel/usePanelControls";
import { hasSidebarModifier } from "@/lib/sidebarModifier";

/**
 * Click handler for a Table-view row. Mirrors `useViewPanelClick`: holding the configured sidebar
 * modifier opens the item in the right-hand panel in view mode; otherwise the supplied
 * `navigateToPage` callback runs (a typed router `navigate(...)` to the item's full page). Passing
 * navigation as a callback keeps TanStack Router's route/param typing at the call site.
 *
 * One additional hardcoded modifier shortcut (priority over sidebar modifier):
 * - **Shift**: navigate to the item's edit page (`navigateToEdit`), if provided.
 */
export function useTableRowNav(): (
  event: MouseEvent,
  ct: DrawerContentType,
  id: string,
  navigateToPage: () => void,
  navigateToEdit?: () => void,
) => void {
  const {
    openItem,
  } = usePanelControls();
  const modifier = useSidebarOpenModifier();

  return useCallback(
    (event, ct, id, navigateToPage, navigateToEdit?: () => void) => {
      if (event.shiftKey) {
        navigateToEdit?.();
        return;
      }
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
