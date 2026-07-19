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
 * Bundles the taxonomy-dataset hooks the entity-scoped listing pages need (the filter rail's
 * options + slug→entity resolution), keeping each route module's import count down. The bookmark
 * list itself is fetched by `useBookmarkSearchView` via the server-side search endpoint, not here.
 */
export function useCategoryPageData() {
  const {
    data: categories, isLoading: categoriesLoading,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tagTree,
  } = useTagTree();
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
    categories,
    categoriesLoading,
    properties,
    tagTree,
    mediaTypes,
    youtubeChannels,
    websites,
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
  };
}
