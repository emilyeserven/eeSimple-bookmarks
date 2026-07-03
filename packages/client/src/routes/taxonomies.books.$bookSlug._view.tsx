import { createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useBookBySlug } from "../hooks/useBooks";
import { booksApi } from "../lib/api/taxonomies";

export const Route = createFileRoute("/taxonomies/books/$bookSlug/_view")({
  component: BookViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/books/$bookSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/books/$bookSlug/image",
    label: "Image",
  },
] as const;

function BookViewLayout() {
  const {
    bookSlug,
  } = Route.useParams();
  const {
    book, isLoading,
  } = useBookBySlug(bookSlug);

  return (
    <TabbedEntityLayout
      header={(
        <TaxonomyViewHeader
          image={{
            kind: "taxonomyImages",
            ownerId: book?.id,
            imagesApi: booksApi.images,
            queryKeyPrefix: "book-images",
          }}
          title={isLoading
            ? "Book"
            : book
              ? (
                <RomanizedLabel
                  name={book.name}
                  romanized={book.romanizedName}
                />
              )
              : "Book not found"}
        />
      )}
      nav={viewNav}
      params={{
        bookSlug,
      }}
      navAriaLabel="Book sections"
    />
  );
}
