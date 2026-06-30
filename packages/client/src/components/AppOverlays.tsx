import { AddImportModal } from "@/components/AddImportModal";
import { CommandPalette } from "@/components/CommandPalette";
import { RightPanel } from "@/components/panel/RightPanel";

/** The always-mounted app-chrome overlays: the right panel, the add-import modal, and the CMD+K
 * command palette. Grouped so the root layout mounts them with a single import. */
export function AppOverlays() {
  return (
    <>
      <RightPanel />
      <AddImportModal />
      <CommandPalette />
    </>
  );
}
