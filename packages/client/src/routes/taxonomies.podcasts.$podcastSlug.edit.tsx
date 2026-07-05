import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { usePodcastBySlug } from "../hooks/usePodcasts";

export const Route = createFileRoute("/taxonomies/podcasts/$podcastSlug/edit")({
  component: PodcastEditLayout,
});

function PodcastEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    podcastSlug,
  } = Route.useParams();
  const {
    podcast, isLoading,
  } = usePodcastBySlug(podcastSlug);

  const editNav = [
    {
      to: "/taxonomies/podcasts/$podcastSlug/edit/general",
      label: t("General"),
    },
    {
      to: "/taxonomies/podcasts/$podcastSlug/edit/image",
      label: t("Image"),
    },
  ] as const;

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/podcasts/$podcastSlug"
            params={{
              podcastSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("podcast") : (podcast?.name ?? t("podcast")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit podcast")}</h1>
        </div>
      )}
      nav={editNav}
      params={{
        podcastSlug,
      }}
      navAriaLabel={t("Podcast edit sections")}
    />
  );
}
