import type { MouseEvent } from "react";

import { useCallback } from "react";

/**
 * Click handler for a Table-view row: the supplied `navigateToPage` callback runs (a typed router
 * `navigate(...)` to the item's full page). Passing navigation as a callback keeps TanStack Router's
 * route/param typing at the call site.
 *
 * One hardcoded modifier shortcut:
 * - **Shift**: navigate to the item's edit page (`navigateToEdit`), if provided.
 */
export function useTableRowNav(): (
  event: MouseEvent,
  navigateToPage: () => void,
  navigateToEdit?: () => void,
) => void {
  return useCallback(
    (event, navigateToPage, navigateToEdit?: () => void) => {
      if (event.shiftKey) {
        navigateToEdit?.();
        return;
      }
      navigateToPage();
    },
    [],
  );
}
