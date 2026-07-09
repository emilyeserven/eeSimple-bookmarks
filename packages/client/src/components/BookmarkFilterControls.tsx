import type { FilterPillsRowProps } from "./FilterPillsRow";

import { BookmarkFilterModalButton } from "./BookmarkFilterModalButton";
import { BookmarkSortPopover } from "./BookmarkSortPopover";
import { FilterPillsRow } from "./FilterPillsRow";

/**
 * The responsive filter area rendered below the search row on bookmark listings (the `filters` slot of
 * {@link ListingSearchBox}). Both breakpoints are laid out with CSS (no `useIsMobile` branch, so there
 * is no first-render flash); React Query dedupes the self-fetching sections mounted in both trees.
 *
 * - **≥md (desktop):** the full editable {@link FilterPillsRow} — unchanged from before.
 * - **<md (phone):** a Sort + Filter button row (Sort here mirrors the desktop button that
 *   {@link ListingSearchBox} hides on mobile), with the **applied** filters listed below as
 *   tap-to-edit chips ({@link FilterPillsRow} in `activeOnly` mode).
 */
export function BookmarkFilterControls(props: FilterPillsRowProps) {
  return (
    <>
      <div
        className="
          hidden
          md:block
        "
      >
        <FilterPillsRow {...props} />
      </div>

      <div
        className="
          space-y-3
          md:hidden
        "
      >
        <div className="flex items-center gap-2">
          <BookmarkSortPopover label />
          <BookmarkFilterModalButton {...props} />
        </div>
        <FilterPillsRow
          {...props}
          activeOnly
        />
      </div>
    </>
  );
}
