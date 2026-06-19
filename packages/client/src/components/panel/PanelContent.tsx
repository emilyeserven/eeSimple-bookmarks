import { getContentType } from "./contentTypes";
import { FiltersPanel } from "./FiltersPanel";
import { NotificationsPanel } from "./NotificationsPanel";
import { PanelList } from "./PanelList";
import { PanelTypeTiles } from "./PanelTypeTiles";
import { usePanelControls } from "./usePanelControls";

import { NEW_SENTINEL } from "@/lib/drawerSearch";

/**
 * Routes the right-hand panel's body through its three nested states:
 * no type → content-type tiles; type only → that type's searchable list; type + id → a single item
 * shown in `view` or `edit` mode. Lists and items are keyed so changing the target remounts them
 * with fresh state.
 */
export function PanelContent() {
  const {
    dCT, dCId, dMode,
  } = usePanelControls();

  if (!dCT) return <PanelTypeTiles />;
  // Notifications is a registry-less, list-only view (no per-item view/edit).
  if (dCT === "notifications") return <NotificationsPanel />;
  // Filters renders the listing page's filter sidebar inline; no registry entry.
  if (dCT === "filters") return <FiltersPanel />;
  if (!dCId) {
    return (
      <PanelList
        key={dCT}
        type={dCT}
      />
    );
  }

  const def = getContentType(dCT);
  // Creating an item is always an edit; otherwise honor the URL mode, defaulting to view.
  const mode = dCId === NEW_SENTINEL ? "edit" : (dMode ?? "view");
  const Body = mode === "edit" ? def.Edit : def.View;
  return (
    <Body
      key={`${dCT}:${dCId}:${mode}`}
      id={dCId}
    />
  );
}
