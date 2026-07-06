import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useBookBySlug } from "../hooks/useBooks";
import { booksApi } from "../lib/api/taxonomies";

/**
 * The book listing shell: the entity header over the `Bookmarks | Gallery | Media | Info` strip,
 * shared by the bookmarks/gallery/media panes and the Info page. `edit` is a sibling of this pathless
 * layout, so the strip never shows while editing.
 */
export const Route = createFileRoute("/taxonomies/books/$bookSlug/_hub")({
  component: BookHubLayout,
});

function BookHubLayout() {
  const {
    t,
  } = useTranslation();
  const {
    bookSlug,
  } = Route.useParams();
  const {
    book, isLoading,
  } = useBookBySlug(bookSlug);

  return (
    <ListingHubLayout
      header={(
        <TaxonomyViewHeader
          image={{
            kind: "taxonomyImages",
            ownerId: book?.id,
            imagesApi: booksApi.images,
            queryKeyPrefix: "book-images",
          }}
          title={isLoading
            ? t("Book")
            : book
              ? (
                <LocalizedNameLabel
                  names={book.names ?? []}
                  base={book.name}
                />
              )
              : t("Book not found")}
        />
      )}
      tabs={[
        {
          to: "/taxonomies/books/$bookSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/books/$bookSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/books/$bookSlug/media",
          label: t("Media"),
        },
        {
          to: "/taxonomies/books/$bookSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        bookSlug,
      }}
      navAriaLabel={t("Book sections")}
    />
  );
}
