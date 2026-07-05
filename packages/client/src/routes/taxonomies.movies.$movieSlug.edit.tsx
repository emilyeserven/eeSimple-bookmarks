import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useMovieBySlug } from "../hooks/useMovies";

export const Route = createFileRoute("/taxonomies/movies/$movieSlug/edit")({
  component: MovieEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/movies/$movieSlug/edit/general",
    label: "General",
  },
  {
    to: "/taxonomies/movies/$movieSlug/edit/image",
    label: "Image",
  },
] as const;

function MovieEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    movieSlug,
  } = Route.useParams();
  const {
    movie, isLoading,
  } = useMovieBySlug(movieSlug);
  const nav = editNav.map(item => ({
    ...item,
    label: t(item.label),
  }));

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/movies/$movieSlug"
            params={{
              movieSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("movie") : (movie?.name ?? t("movie")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit movie")}</h1>
        </div>
      )}
      nav={nav}
      params={{
        movieSlug,
      }}
      navAriaLabel={t("Movie edit sections")}
    />
  );
}
