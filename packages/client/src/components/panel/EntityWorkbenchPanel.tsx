import type { EntityWorkbench, WorkbenchMode } from "../workbench/types";

import { usePanelControls } from "./usePanelControls";
import { usePanelDismissAfterDelete } from "./usePanelDismissAfterDelete";
import { EntityWorkbenchView } from "../workbench/EntityWorkbenchView";

interface Props<E extends { id: string }> {
  workbench: EntityWorkbench<E>;
  id: string;
  mode: WorkbenchMode;
}

/**
 * Drawer adapter for `EntityWorkbenchView`: wires the panel's URL state (the active tab `dTab`, the
 * view/edit `dMode`) and the dismiss-after-delete behavior into the surface-agnostic workbench
 * renderer, so each panel content type stays a one-liner. The same `EntityWorkbench` descriptor backs
 * the main-pane routes — this is the right-panel parity invariant.
 */
export function EntityWorkbenchPanel<E extends { id: string }>({
  workbench, id, mode,
}: Props<E>) {
  const {
    dTab, setTab, setMode,
  } = usePanelControls();
  const dismiss = usePanelDismissAfterDelete();

  return (
    <EntityWorkbenchView
      workbench={workbench}
      id={id}
      mode={mode}
      activeTab={dTab}
      onTabChange={setTab}
      onModeChange={setMode}
      onDeleted={dismiss}
    />
  );
}
