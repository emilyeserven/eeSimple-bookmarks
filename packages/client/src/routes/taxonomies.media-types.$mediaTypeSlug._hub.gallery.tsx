import { createFileRoute } from "@tanstack/react-router";

import { MediaTypeListing } from "./-mediaTypeListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/_hub/gallery")({
  validateSearch: validateBookmarkSearch,
  component: MediaTypeGalleryTab,
});

function MediaTypeGalleryTab() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <MediaTypeListing
      mediaTypeSlug={mediaTypeSlug}
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
