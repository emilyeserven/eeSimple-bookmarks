import { ColumnsSelect, ViewModeToggle } from "./DisplayControlPrimitives";
import { supportsMapView, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { useUiStore } from "../stores/uiStore";

interface ListingDisplayControlsProps {
  pageKey: string;
}

/**
 * The per-listing display controls that remain page-level: the card/table view toggle and the grid
 * column count. Everything else about how a bookmark card looks (field visibility, image
 * presentation) is governed by Card Display Rules (Settings → Card Display Rules), not per page.
 */
export function ListingDisplayControls({
  pageKey,
}: ListingDisplayControlsProps) {
  const viewMode = useViewMode(pageKey);
  const setViewMode = useUiStore(state => state.setViewMode);
  const columns = useBookmarkColumns(pageKey);
  const setBookmarkColumns = useUiStore(state => state.setBookmarkColumns);

  return (
    <div className="flex flex-col gap-2.5">
      <ViewModeToggle
        value={viewMode}
        onChange={mode => setViewMode(pageKey, mode)}
        showMap={supportsMapView(pageKey)}
      />
      {viewMode === "cards" && (
        <ColumnsSelect
          value={columns}
          onChange={count => setBookmarkColumns(pageKey, count)}
        />
      )}
    </div>
  );
}
