import { createFileRoute } from "@tanstack/react-router";

import { CategoryListing } from "./-categoryListing";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/categories/$categorySlug/_hub/gallery")({
  validateSearch: validateBookmarkSearch,
  component: CategoryGalleryTab,
});

function CategoryGalleryTab() {
  const {
    categorySlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <CategoryListing
      categorySlug={categorySlug}
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
