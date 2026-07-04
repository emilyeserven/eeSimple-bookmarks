import { useCategoryPageData } from "./-categoryPageData";
import { useAlbums } from "../hooks/useAlbums";
import { useBooks } from "../hooks/useBooks";
import { useEpisodes } from "../hooks/useEpisodes";
import { useMovies } from "../hooks/useMovies";
import { usePodcasts } from "../hooks/usePodcasts";
import { useTracks } from "../hooks/useTracks";
import { useTvShows } from "../hooks/useTvShows";

/**
 * Bundles everything the media-property bookmarks page needs: the standard `useCategoryPageData` props
 * plus the seven media lists it joins over to resolve which bookmarks belong to the property (bookmarks
 * carry no `mediaPropertyId`, so membership hops through their linked media items). Keeps the route
 * module's import count down; behaviour is identical to calling each hook inline.
 */
export function useMediaPropertyPageData(tags: string[] | undefined) {
  const base = useCategoryPageData(tags);
  const {
    data: movies,
  } = useMovies();
  const {
    data: tvShows,
  } = useTvShows();
  const {
    data: episodes,
  } = useEpisodes();
  const {
    data: albums,
  } = useAlbums();
  const {
    data: tracks,
  } = useTracks();
  const {
    data: books,
  } = useBooks();
  const {
    data: podcasts,
  } = usePodcasts();

  return {
    ...base,
    mediaLists: {
      movies: movies ?? [],
      tvShows: tvShows ?? [],
      episodes: episodes ?? [],
      albums: albums ?? [],
      tracks: tracks ?? [],
      books: books ?? [],
      podcasts: podcasts ?? [],
    },
  };
}
