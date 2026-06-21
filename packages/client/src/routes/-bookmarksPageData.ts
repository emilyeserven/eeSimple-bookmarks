import { useBookmarks } from "../hooks/useBookmarks";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { usePropertyGroups } from "../hooks/usePropertyGroups";
import { useRelationshipTypes } from "../hooks/useRelationshipTypes";
import { useTagTree } from "../hooks/useTags";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";

/**
 * Bundles the data hooks the Bookmarks page needs into a single call, keeping the route module's
 * import count down. Behaviour is identical to calling each hook inline.
 */
export function useBookmarksPageData(tags: string[] | undefined) {
  const {
    data: bookmarks, isLoading, error,
  } = useBookmarks(tags);
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: customProperties,
  } = useCustomProperties();
  const {
    data: propertyGroups,
  } = usePropertyGroups();
  const {
    data: categories,
  } = useCategories();
  const {
    data: mediaTypes,
  } = useMediaTypes();
  const {
    data: youtubeChannels,
  } = useYouTubeChannels();
  const {
    data: websites,
  } = useWebsites();
  const {
    data: relationshipTypes,
  } = useRelationshipTypes();

  return {
    bookmarks,
    isLoading,
    error,
    tagTree,
    customProperties,
    propertyGroups,
    categories,
    mediaTypes,
    youtubeChannels,
    websites,
    relationshipTypes,
  };
}
