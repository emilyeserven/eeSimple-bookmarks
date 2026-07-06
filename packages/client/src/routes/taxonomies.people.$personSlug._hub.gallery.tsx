import { createFileRoute } from "@tanstack/react-router";

import { PersonListing } from "./-personListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/people/$personSlug/_hub/gallery")({
  validateSearch: validateBookmarkSearch,
  component: PersonGalleryTab,
});

function PersonGalleryTab() {
  const {
    personSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <PersonListing
      personSlug={personSlug}
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
