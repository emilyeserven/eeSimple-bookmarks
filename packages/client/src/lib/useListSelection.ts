import { useCallback, useMemo } from "react";

import { useUiStore } from "@/stores/uiStore";

/** Stable empty fallback so an unset selection doesn't produce a new array identity each render. */
const EMPTY: string[] = [];

export interface ListSelection {
  /** Currently-selected ids for this page (in selection order). */
  selectedIds: string[];
  /** Set view of `selectedIds` for O(1) membership checks in render loops. */
  selectedSet: Set<string>;
  isSelected: (id: string) => boolean;
  /** Add the id if absent, remove it if present. */
  toggle: (id: string) => void;
  /** Select every id in `allIds` (the visible, selectable set passed to the hook). */
  selectAll: () => void;
  /** Deselect everything (keeps selection mode on). */
  clear: () => void;
  count: number;
  /** True when every `allIds` entry is selected (and there is at least one). */
  allSelected: boolean;
  /** Card-view selection mode (clicking a card selects instead of navigating). */
  mode: boolean;
  setMode: (on: boolean) => void;
}

/**
 * Per-`pageKey` multi-select controller for listing pages, backed by the transient `uiStore`
 * selection slice — so a listing's card and table views share one selection, and nothing persists.
 * `allIds` is the full set of currently-visible *selectable* ids; `selectAll` / `allSelected` operate
 * over it (callers pass already-filtered ids, e.g. excluding built-ins that can't be deleted).
 */
export function useListSelection(pageKey: string, allIds: string[]): ListSelection {
  const selectedIds = useUiStore(state => state.selection[pageKey]) ?? EMPTY;
  const setSelection = useUiStore(state => state.setSelection);
  const clearSelection = useUiStore(state => state.clearSelection);
  const mode = useUiStore(state => state.selectionMode[pageKey]) ?? false;
  const setSelectionMode = useUiStore(state => state.setSelectionMode);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggle = useCallback((id: string) => {
    const next = selectedSet.has(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    setSelection(pageKey, next);
  }, [pageKey, selectedIds, selectedSet, setSelection]);

  const selectAll = useCallback(
    () => setSelection(pageKey, allIds),
    [pageKey, allIds, setSelection],
  );
  const clear = useCallback(() => clearSelection(pageKey), [pageKey, clearSelection]);
  const setMode = useCallback(
    (on: boolean) => setSelectionMode(pageKey, on),
    [pageKey, setSelectionMode],
  );

  const allSelected = allIds.length > 0 && allIds.every(id => selectedSet.has(id));

  return {
    selectedIds,
    selectedSet,
    isSelected: (id: string) => selectedSet.has(id),
    toggle,
    selectAll,
    clear,
    count: selectedIds.length,
    allSelected,
    mode,
    setMode,
  };
}
