import { useBookmarks } from "../../../hooks/useBookmarks";
import { useCategories } from "../../../hooks/useCategories";
import { useCustomProperties } from "../../../hooks/useCustomProperties";
import { usePropertyGroups } from "../../../hooks/usePropertyGroups";

/**
 * The read-only queries the panel's `BookmarkView` renders from (the bookmark list it resolves the
 * item out of, plus the categories / custom-properties / property-groups `BookmarkDetail` needs).
 * Grouped into one hook so `BookmarkView` stays under the per-file import cap.
 */
export function useBookmarkViewData() {
  const bookmarksQuery = useBookmarks();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: propertyGroups,
  } = usePropertyGroups();
  const {
    data: categories,
  } = useCategories();

  return {
    bookmarksQuery,
    properties,
    propertyGroups,
    categories,
  };
}
