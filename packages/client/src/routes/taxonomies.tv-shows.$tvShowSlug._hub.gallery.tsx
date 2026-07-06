import { createFileRoute } from "@tanstack/react-router";

import { TvShowListing } from "./-tvShowListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/tv-shows/$tvShowSlug/_hub/gallery")({
  validateSearch: validateBookmarkSearch,
  component: TvShowGalleryTab,
});

function TvShowGalleryTab() {
  const {
    tvShowSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <TvShowListing
      tvShowSlug={tvShowSlug}
      activeView="gallery"
      search={search}
      onSearchChange={next =>
        navigate({
          search: next,
          replace: true,
          resetScroll: false,
        })}
    />
  );
}
