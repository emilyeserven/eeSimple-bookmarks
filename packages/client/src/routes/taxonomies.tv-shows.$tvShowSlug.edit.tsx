import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useTvShowBySlug } from "../hooks/useTvShows";

export const Route = createFileRoute("/taxonomies/tv-shows/$tvShowSlug/edit")({
  component: TvShowEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/tv-shows/$tvShowSlug/edit/general",
    label: "General",
  },
  {
    to: "/taxonomies/tv-shows/$tvShowSlug/edit/image",
    label: "Image",
  },
] as const;

function TvShowEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    tvShowSlug,
  } = Route.useParams();
  const {
    tvShow, isLoading,
  } = useTvShowBySlug(tvShowSlug);
  const nav = editNav.map(item => ({
    ...item,
    label: t(item.label),
  }));

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/tv-shows/$tvShowSlug"
            params={{
              tvShowSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("TV show") : (tvShow?.name ?? t("TV show")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit TV show")}</h1>
        </div>
      )}
      nav={nav}
      params={{
        tvShowSlug,
      }}
      navAriaLabel={t("TV show edit sections")}
    />
  );
}
