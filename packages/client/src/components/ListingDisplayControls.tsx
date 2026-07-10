import { ColumnsSelect, ImageAspectSelect, ViewModeToggle } from "./DisplayControlPrimitives";
import { useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { useUiStore } from "../stores/uiStore";

interface ListingDisplayControlsProps {
  pageKey: string;
  /**
   * When true, also render the image Aspect (ratio/cropping) selector. Enabled for image-bearing
   * listings (a registered listing page with `showsImages`); omitted where cards carry no image.
   */
  showImageControls?: boolean;
}

/**
 * The per-listing display controls that remain page-level: the card/table view toggle, the grid
 * column count, and — on image-bearing listings — the image Aspect override. The Aspect override
 * wins over each card's Card Display Rule aspect for this listing (its "Default" option clears the
 * override so rules apply again). Everything else about how a bookmark card looks (field visibility,
 * corner overlays) is governed by Card Display Rules (Settings → Card Display Rules), not per page.
 */
export function ListingDisplayControls({
  pageKey,
  showImageControls = false,
}: ListingDisplayControlsProps) {
  const viewMode = useViewMode(pageKey);
  const setViewMode = useUiStore(state => state.setViewMode);
  const columns = useBookmarkColumns(pageKey);
  const setBookmarkColumns = useUiStore(state => state.setBookmarkColumns);
  const imageMode = useUiStore(state => state.bookmarkImageMode[pageKey]);
  const setBookmarkImageMode = useUiStore(state => state.setBookmarkImageMode);
  const clearBookmarkImageMode = useUiStore(state => state.clearBookmarkImageMode);

  return (
    <div className="flex flex-col gap-2.5">
      <ViewModeToggle
        value={viewMode}
        onChange={mode => setViewMode(pageKey, mode)}
      />
      {viewMode === "cards" && (
        <ColumnsSelect
          value={columns}
          onChange={count => setBookmarkColumns(pageKey, count)}
        />
      )}
      {showImageControls && (
        <ImageAspectSelect
          value={imageMode}
          onChange={next => (next === undefined
            ? clearBookmarkImageMode(pageKey)
            : setBookmarkImageMode(pageKey, next))}
        />
      )}
    </div>
  );
}
