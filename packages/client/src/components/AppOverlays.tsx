import { AddImportModal } from "@/components/AddImportModal";
import { CommandPalette } from "@/components/CommandPalette";

/** The always-mounted app-chrome overlays: the add-import modal and the CMD+K command palette.
 * Grouped so the root layout mounts them with a single import. */
export function AppOverlays() {
  return (
    <>
      <AddImportModal />
      <CommandPalette />
    </>
  );
}
