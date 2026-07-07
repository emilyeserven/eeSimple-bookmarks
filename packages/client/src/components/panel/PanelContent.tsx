import { AiSummarizationPanel } from "./AiSummarizationPanel";
import { getContentType } from "./contentTypes";
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
  // AI Summarization is a single-page action tool; no list or item detail.
  if (dCT === "ai-summarization") return <AiSummarizationPanel />;
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
