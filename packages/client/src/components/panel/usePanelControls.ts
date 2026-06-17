import type { DrawerContentType, DrawerSearch } from "@/lib/drawerSearch";

import { useNavigate, useSearch } from "@tanstack/react-router";

/** Imperative controls + current state for the shared right-hand panel (URL-driven). */
export interface PanelControls {
  dCT?: DrawerContentType;
  dCId?: string;
  /** True when both drawer params are present (the panel has content to show). */
  isOpen: boolean;
  /** Open the autofill editor for a rule id, or `NEW_SENTINEL` to create one. */
  openAutofill: (id: string) => void;
  /** Open the tag editor for a tag id, or `NEW_SENTINEL` to create one. */
  openTag: (id: string) => void;
  /** Close the panel, clearing both drawer params while preserving other search state. */
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
        dCT: next.dCT,
        dCId: next.dCId,
      }),
    });
  }

  return {
    dCT: search.dCT,
    dCId: search.dCId,
    isOpen: Boolean(search.dCT && search.dCId),
    openAutofill: id => setContent({
      dCT: "autofill",
      dCId: id,
    }),
    openTag: id => setContent({
      dCT: "tag",
      dCId: id,
    }),
    close: () => setContent({}),
  };
}
