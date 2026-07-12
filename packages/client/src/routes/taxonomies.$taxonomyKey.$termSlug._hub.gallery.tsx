import { createFileRoute } from "@tanstack/react-router";

import { TaxonomyTermListing } from "./-taxonomyTermListing";
import { useTaxonomyBySlug, useTaxonomyTermBySlug } from "../hooks/useTaxonomies";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/$taxonomyKey/$termSlug/_hub/gallery")({
  validateSearch: validateBookmarkSearch,
  component: TaxonomyTermGalleryTab,
});

function TaxonomyTermGalleryTab() {
  const {
    taxonomyKey, termSlug,
  } = Route.useParams();
  const {
    taxonomy,
  } = useTaxonomyBySlug(taxonomyKey);
  const {
    term,
  } = useTaxonomyTermBySlug(taxonomy?.id, termSlug);
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  if (!term) return null;

  return (
    <TaxonomyTermListing
      term={term}
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
