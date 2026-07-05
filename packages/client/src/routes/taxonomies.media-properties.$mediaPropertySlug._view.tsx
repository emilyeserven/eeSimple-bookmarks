import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useMediaPropertyBySlug } from "../hooks/useMediaProperties";

export const Route = createFileRoute("/taxonomies/media-properties/$mediaPropertySlug/_view")({
  component: MediaPropertyViewLayout,
});

function MediaPropertyViewLayout() {
  const {
    t,
  } = useTranslation();
  const {
    mediaPropertySlug,
  } = Route.useParams();
  const {
    mediaProperty, isLoading,
  } = useMediaPropertyBySlug(mediaPropertySlug);

  const viewNav = [
    {
      to: "/taxonomies/media-properties/$mediaPropertySlug/general",
      label: t("General"),
    },
  ] as const;

  return (
    <TabbedEntityLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading ? t("Media property") : (mediaProperty?.name ?? t("Media property not found"))}
        </h1>
      )}
      nav={viewNav}
      params={{
        mediaPropertySlug,
      }}
      navAriaLabel={t("Media property sections")}
    />
  );
}
