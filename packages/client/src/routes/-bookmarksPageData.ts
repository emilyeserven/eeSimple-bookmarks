import { useBookmarks } from "../hooks/useBookmarks";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useGenreMoods } from "../hooks/useGenreMoods";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { usePeople } from "../hooks/usePeople";
import { usePlaceTypes } from "../hooks/usePlaceTypes";
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
  const {
    data: people,
  } = usePeople();
  const {
    data: placeTypes,
  } = usePlaceTypes();
  const {
    data: genreMoods,
  } = useGenreMoods();

  return {
    bookmarks,
    isLoading,
    error,
    tagTree,
    customProperties,
    categories,
    mediaTypes,
    youtubeChannels,
    websites,
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
  };
}
