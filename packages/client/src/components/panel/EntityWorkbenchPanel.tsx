import type { EntityWorkbench, WorkbenchMode } from "../workbench/types";
import type { DrawerContentType } from "@/lib/drawerSearch";

import { useNavigate } from "@tanstack/react-router";

import { buildMainPanePath } from "./mainPanePaths";
import { usePanelControls } from "./usePanelControls";
import { usePanelDismissAfterDelete } from "./usePanelDismissAfterDelete";
import { EntityWorkbenchView } from "../workbench/EntityWorkbenchView";

interface Props<E extends { id: string }> {
  workbench: EntityWorkbench<E>;
  id: string;
  mode: WorkbenchMode;
  /**
   * The panel content type for this entity. When provided along with `workbench.getSlug`, the panel
   * header shows an "Open in main pane" button that navigates to the entity's full page.
   */
  contentType?: DrawerContentType;
}

/**
 * Drawer adapter for `EntityWorkbenchView`: wires the panel's URL state (the active tab `dTab`, the
 * view/edit `dMode`) and the dismiss-after-delete behavior into the surface-agnostic workbench
 * renderer, so each panel content type stays a one-liner. The same `EntityWorkbench` descriptor backs
 * the main-pane routes — this is the right-panel parity invariant.
 */
export function EntityWorkbenchPanel<E extends { id: string }>({
  workbench, id, mode, contentType,
}: Props<E>) {
  const {
    dTab, setTab, setMode, close,
  } = usePanelControls();
  const dismiss = usePanelDismissAfterDelete();
  const navigate = useNavigate();

  const {
    getSlug,
  } = workbench;
  const buildSendToMainPane = getSlug && contentType
    ? (entity: E) => {
      const slug = getSlug(entity);
      if (!slug) return undefined;
      const tab = dTab ?? "general";
      const path = buildMainPanePath(contentType, slug, tab);
      if (!path) return undefined;
      return () => {
        void navigate({
          href: path,
        });
        close();
      };
    }
    : undefined;

  return (
    <EntityWorkbenchView
      workbench={workbench}
      id={id}
      mode={mode}
      activeTab={dTab}
      onTabChange={setTab}
      onModeChange={setMode}
      onDeleted={dismiss}
      buildSendToMainPane={buildSendToMainPane}
    />
  );
}
