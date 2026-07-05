import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useBookBySlug } from "../hooks/useBooks";
import i18n from "../i18n";
import { booksApi } from "../lib/api/taxonomies";

export const Route = createFileRoute("/taxonomies/books/$bookSlug/_view")({
  component: BookViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/books/$bookSlug/general",
    label: i18n.t("General"),
  },
  {
    to: "/taxonomies/books/$bookSlug/image",
    label: i18n.t("Image"),
  },
] as const;

function BookViewLayout() {
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
            ? t("Book")
            : book
              ? (
                <RomanizedLabel
                  name={book.name}
                  romanized={book.romanizedName}
                />
              )
              : t("Book not found")}
        />
      )}
      nav={viewNav}
      params={{
        bookSlug,
      }}
      navAriaLabel={t("Book sections")}
    />
  );
}
