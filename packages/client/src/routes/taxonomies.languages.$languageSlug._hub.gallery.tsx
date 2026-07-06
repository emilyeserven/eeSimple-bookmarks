import { createFileRoute } from "@tanstack/react-router";

import { LanguageListing, validateLanguageSearch } from "./-languageListing";

export const Route = createFileRoute("/taxonomies/languages/$languageSlug/_hub/gallery")({
  validateSearch: validateLanguageSearch,
  component: LanguageGalleryTab,
});

function LanguageGalleryTab() {
  const {
    languageSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <LanguageListing
      languageSlug={languageSlug}
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
