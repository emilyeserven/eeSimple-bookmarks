import { useBookmarks } from "../hooks/useBookmarks";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { usePropertyGroups } from "../hooks/usePropertyGroups";
import { useTagTree } from "../hooks/useTags";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";

/**
 * Bundles the data hooks the category page needs into a single call, keeping the route module's
 * import count down. Behaviour is identical to calling each hook inline.
 */
export function useCategoryPageData(tag: string | undefined) {
  const {
    data: categories, isLoading: categoriesLoading,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: propertyGroups,
  } = usePropertyGroups();
  const {
    data: bookmarks, isLoading: bookmarksLoading, error,
  } = useBookmarks(tag);
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: mediaTypes,
  } = useMediaTypes();
  const {
    data: youtubeChannels,
  } = useYouTubeChannels();

  return {
    categories,
    categoriesLoading,
    properties,
    propertyGroups,
    bookmarks,
    bookmarksLoading,
    error,
    tagTree,
    mediaTypes,
    youtubeChannels,
  };
}
