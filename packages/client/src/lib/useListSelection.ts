import { useCallback, useMemo, useRef } from "react";

import { useUiStore } from "@/stores/uiStore";

/** Stable empty fallback so an unset selection doesn't produce a new array identity each render. */
const EMPTY: string[] = [];

export interface ListSelection {
  /** Currently-selected ids for this page (in selection order). */
  selectedIds: string[];
  /** Set view of `selectedIds` for O(1) membership checks in render loops. */
  selectedSet: Set<string>;
  isSelected: (id: string) => boolean;
  /** Add the id if absent, remove it if present. Sets the range anchor to this id. */
  toggle: (id: string) => void;
  /**
   * Shift-click range select: add every id between the last-toggled anchor and `id` (inclusive, in
   * `allIds`/display order) to the current selection, without clearing what's already selected. Falls
   * back to {@link toggle} when there is no usable anchor yet (first click) or the anchor has scrolled
   * out of the visible set. The anchor stays put, so repeated shift-clicks extend from the same origin.
   */
  selectRange: (id: string) => void;
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

  // The last id toggled without shift — the origin a subsequent shift-click ranges from. A ref (not
  // state) since it never affects rendering, and it survives a card↔table view toggle because the
  // same hook instance backs both views of one listing.
  const anchorRef = useRef<string | null>(null);

  const toggle = useCallback((id: string) => {
    anchorRef.current = id;
    const next = selectedSet.has(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    setSelection(pageKey, next);
  }, [pageKey, selectedIds, selectedSet, setSelection]);

  const selectRange = useCallback((id: string) => {
    const anchor = anchorRef.current;
    const anchorIdx = anchor != null ? allIds.indexOf(anchor) : -1;
    const targetIdx = allIds.indexOf(id);
    // No usable anchor (first click, or it scrolled out of view) → behave like a plain toggle.
    if (anchorIdx < 0 || targetIdx < 0) {
      anchorRef.current = id;
      const next = selectedSet.has(id)
        ? selectedIds.filter(x => x !== id)
        : [...selectedIds, id];
      setSelection(pageKey, next);
      return;
    }
    const [lo, hi] = anchorIdx <= targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx];
    // Additive union: keep whatever was already selected, append the newly-covered range in order.
    const merged = [...selectedIds];
    for (const rangeId of allIds.slice(lo, hi + 1)) {
      if (!selectedSet.has(rangeId)) merged.push(rangeId);
    }
    setSelection(pageKey, merged);
    // Anchor intentionally unchanged, so successive shift-clicks re-range from the same origin.
  }, [allIds, pageKey, selectedIds, selectedSet, setSelection]);

  const selectAll = useCallback(
    () => setSelection(pageKey, allIds),
    [pageKey, allIds, setSelection],
  );
  const clear = useCallback(() => {
    anchorRef.current = null;
    clearSelection(pageKey);
  }, [pageKey, clearSelection]);
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
    selectRange,
    selectAll,
    clear,
    count: selectedIds.length,
    allSelected,
    mode,
    setMode,
  };
}
