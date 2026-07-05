import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useEpisodeBySlug } from "../hooks/useEpisodes";
import i18n from "../i18n";

export const Route = createFileRoute("/taxonomies/episodes/$episodeSlug/edit")({
  component: EpisodeEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/episodes/$episodeSlug/edit/general",
    label: i18n.t("General"),
  },
  {
    to: "/taxonomies/episodes/$episodeSlug/edit/image",
    label: i18n.t("Image"),
  },
] as const;

function EpisodeEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    episodeSlug,
  } = Route.useParams();
  const {
    episode, isLoading,
  } = useEpisodeBySlug(episodeSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/episodes/$episodeSlug"
            params={{
              episodeSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("episode") : (episode?.name ?? t("episode")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit episode")}</h1>
        </div>
      )}
      nav={editNav}
      params={{
        episodeSlug,
      }}
      navAriaLabel={t("Episode edit sections")}
    />
  );
}
