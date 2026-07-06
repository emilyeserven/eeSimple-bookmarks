import { createFileRoute } from "@tanstack/react-router";

import { WebsiteListing } from "./-websiteListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/_hub/gallery")({
  validateSearch: validateBookmarkSearch,
  component: WebsiteGalleryTab,
});

function WebsiteGalleryTab() {
  const {
    websiteSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <WebsiteListing
      websiteSlug={websiteSlug}
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
