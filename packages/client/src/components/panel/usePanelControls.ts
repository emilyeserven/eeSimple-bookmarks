import type { DrawerContentType, DrawerMode, DrawerSearch } from "@/lib/drawerSearch";

import { useNavigate, useSearch } from "@tanstack/react-router";

import { NEW_SENTINEL } from "@/lib/drawerSearch";

/** Imperative controls + current state for the shared right-hand panel (URL-driven). */
export interface PanelControls {
  dCT?: DrawerContentType;
  dCId?: string;
  dMode?: DrawerMode;
  /** True when the panel is open (showing tiles, a list, or an item). */
  isOpen: boolean;
  /** Open the panel with no content selected — shows the content-type tiles. */
  open: () => void;
  /** Open the panel on a content type's searchable list. */
  openType: (ct: DrawerContentType) => void;
  /** Open a single item in the panel, in `view` (default) or `edit` mode. */
  openItem: (ct: DrawerContentType, id: string, mode?: DrawerMode) => void;
  /** Open the autofill editor for a rule id, or `NEW_SENTINEL` to create one. */
  openAutofill: (id: string) => void;
  /** Open a tag for a tag id, or `NEW_SENTINEL` to create one. */
  openTag: (id: string) => void;
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
      }),
    });
  }

  return {
    dCT: search.dCT,
    dCId: search.dCId,
    dMode: search.dMode,
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
    // The autofill panel is an editor for both existing and new rules.
    openAutofill: id => setContent({
      dOpen: true,
      dCT: "autofill",
      dCId: id,
      dMode: "edit",
    }),
    close: () => setContent({}),
  };
}
