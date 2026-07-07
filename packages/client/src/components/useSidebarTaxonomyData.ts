import { useGroups } from "../hooks/useGroups";
import { useGroupTypes } from "../hooks/useGroupTypes";
import { useLocationRelations } from "../hooks/useLocationRelations";
import { useLocations } from "../hooks/useLocations";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useNewsletters } from "../hooks/useNewsletters";
import { usePeople } from "../hooks/usePeople";
import { usePlaceTypes } from "../hooks/usePlaceTypes";
import { useTags } from "../hooks/useTags";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";

/** The taxonomy entity lists the sidebar renders (tags / websites / media types / …). */
export function useSidebarTaxonomyData() {
  return {
    allTags: useTags().data,
    allWebsites: useWebsites().data,
    allMediaTypes: useMediaTypes().data,
    allLocations: useLocations().data,
    allPlaceTypes: usePlaceTypes().data,
    allLocationRelations: useLocationRelations().data,
    allChannels: useYouTubeChannels().data,
    allNewsletters: useNewsletters().data,
    allPeople: usePeople().data,
    allGroups: useGroups().data,
    allGroupTypes: useGroupTypes().data,
  };
}
