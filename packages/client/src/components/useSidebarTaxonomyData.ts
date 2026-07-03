import { useAlbums } from "../hooks/useAlbums";
import { useArtists } from "../hooks/useArtists";
import { useAuthors } from "../hooks/useAuthors";
import { useBooks } from "../hooks/useBooks";
import { useEpisodes } from "../hooks/useEpisodes";
import { useLocations } from "../hooks/useLocations";
import { useMediaProperties } from "../hooks/useMediaProperties";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useMovies } from "../hooks/useMovies";
import { useNewsletters } from "../hooks/useNewsletters";
import { usePlaceTypes } from "../hooks/usePlaceTypes";
import { usePublishers } from "../hooks/usePublishers";
import { useTags } from "../hooks/useTags";
import { useTracks } from "../hooks/useTracks";
import { useTvShows } from "../hooks/useTvShows";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";

/** The taxonomy entity lists the sidebar renders (tags / websites / media types / …). */
export function useSidebarTaxonomyData() {
  return {
    allTags: useTags().data,
    allWebsites: useWebsites().data,
    allMediaTypes: useMediaTypes().data,
    allMediaProperties: useMediaProperties().data,
    allBooks: useBooks().data,
    allMovies: useMovies().data,
    allTvShows: useTvShows().data,
    allEpisodes: useEpisodes().data,
    allAlbums: useAlbums().data,
    allArtists: useArtists().data,
    allTracks: useTracks().data,
    allLocations: useLocations().data,
    allPlaceTypes: usePlaceTypes().data,
    allChannels: useYouTubeChannels().data,
    allNewsletters: useNewsletters().data,
    allAuthors: useAuthors().data,
    allPublishers: usePublishers().data,
  };
}
