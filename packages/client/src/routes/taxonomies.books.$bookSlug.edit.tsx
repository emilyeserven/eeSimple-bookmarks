import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useBookBySlug } from "../hooks/useBooks";

import i18n from "@/i18n";

export const Route = createFileRoute("/taxonomies/books/$bookSlug/edit")({
  component: BookEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/books/$bookSlug/edit/general",
    label: i18n.t("General"),
  },
  {
    to: "/taxonomies/books/$bookSlug/edit/image",
    label: i18n.t("Image"),
  },
] as const;

function BookEditLayout() {
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
        <div className="space-y-1">
          <Link
            to="/taxonomies/books/$bookSlug"
            params={{
              bookSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("book") : (book?.name ?? t("book")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit book")}</h1>
        </div>
      )}
      nav={editNav}
      params={{
        bookSlug,
      }}
      navAriaLabel={t("Book edit sections")}
    />
  );
}
