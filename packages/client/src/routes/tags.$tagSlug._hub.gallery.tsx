import { createFileRoute } from "@tanstack/react-router";

import { TagListing, validateTagSearch } from "./-tagListing";

export const Route = createFileRoute("/tags/$tagSlug/_hub/gallery")({
  validateSearch: validateTagSearch,
  component: TagGalleryTab,
});

function TagGalleryTab() {
  const {
    tagSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <TagListing
      tagSlug={tagSlug}
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
