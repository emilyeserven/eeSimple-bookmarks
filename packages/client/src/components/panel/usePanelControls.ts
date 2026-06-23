import type { DrawerContentType, DrawerMode, DrawerSearch } from "@/lib/drawerSearch";

import { useNavigate, useSearch } from "@tanstack/react-router";

import { NEW_SENTINEL } from "@/lib/drawerSearch";

/** Imperative controls + current state for the shared right-hand panel (URL-driven). */
export interface PanelControls {
  dCT?: DrawerContentType;
  dCId?: string;
  dMode?: DrawerMode;
  /** Active tab key within a multi-tab entity, or undefined for its first tab. */
  dTab?: string;
  /** True when the panel is open (showing tiles, a list, or an item). */
  isOpen: boolean;
  /** Open the panel with no content selected — shows the content-type tiles. */
  open: () => void;
  /** Open the panel on a content type's searchable list. */
  openType: (ct: DrawerContentType) => void;
  /** Open a single item in the panel, in `view` (default) or `edit` mode (resets the active tab). */
  openItem: (ct: DrawerContentType, id: string, mode?: DrawerMode) => void;
  /** Open the autofill editor for a rule id, or `NEW_SENTINEL` to create one. */
  openAutofill: (id: string) => void;
  /** Open an import rule for a rule id, or `NEW_SENTINEL` to create one. */
  openImportRule: (id: string) => void;
  /** Open a tag for a tag id, or `NEW_SENTINEL` to create one. */
  openTag: (id: string) => void;
  /** Switch the open item between view and edit, keeping the active tab. */
  setMode: (mode: DrawerMode) => void;
  /** Select the active tab of the open item. */
  setTab: (tab: string) => void;
  /** Close the panel, clearing every drawer param while preserving other search state. */
  close: () => void;
}

export function usePanelControls(): PanelControls {
  const navigate = useNavigate();
  const search = useSearch({
    strict: false,
  }) as DrawerSearch;

  function setContent(next: DrawerSearch) {
    void navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        dOpen: next.dOpen,
        dCT: next.dCT,
        dCId: next.dCId,
        dMode: next.dMode,
        dTab: next.dTab,
      }),
    });
  }

  /** Patch a subset of the drawer params, leaving the rest (and other search state) untouched. */
  function patch(next: Partial<DrawerSearch>) {
    void navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        ...next,
      }),
    });
  }

  return {
    dCT: search.dCT,
    dCId: search.dCId,
    dMode: search.dMode,
    dTab: search.dTab,
    isOpen: Boolean(search.dOpen),
    open: () => setContent({
      dOpen: true,
    }),
    openType: ct => setContent({
      dOpen: true,
      dCT: ct,
    }),
    openItem: (ct, id, mode = "view") => setContent({
      dOpen: true,
      dCT: ct,
      dCId: id,
      dMode: mode,
    }),
    // Tags are view-first (matching the old in-panel default); creating one opens its editor.
    openTag: id => setContent({
      dOpen: true,
      dCT: "tag",
      dCId: id,
      dMode: id === NEW_SENTINEL ? "edit" : "view",
    }),
    // Autofill rules open in view mode for existing rules; new ones open the editor.
    openAutofill: id => setContent({
      dOpen: true,
      dCT: "autofill",
      dCId: id,
      dMode: id === NEW_SENTINEL ? "edit" : "view",
    }),
    // Import rules open in view mode for existing rules; new ones open the editor.
    openImportRule: id => setContent({
      dOpen: true,
      dCT: "import-rule",
      dCId: id,
      dMode: id === NEW_SENTINEL ? "edit" : "view",
    }),
    setMode: mode => patch({
      dMode: mode,
    }),
    setTab: tab => patch({
      dTab: tab,
    }),
    close: () => setContent({}),
  };
}
