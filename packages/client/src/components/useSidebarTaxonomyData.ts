import { useAuthors } from "../hooks/useAuthors";
import { useLocations } from "../hooks/useLocations";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useNewsletters } from "../hooks/useNewsletters";
import { usePublishers } from "../hooks/usePublishers";
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
    allChannels: useYouTubeChannels().data,
    allNewsletters: useNewsletters().data,
    allAuthors: useAuthors().data,
    allPublishers: usePublishers().data,
  };
}
