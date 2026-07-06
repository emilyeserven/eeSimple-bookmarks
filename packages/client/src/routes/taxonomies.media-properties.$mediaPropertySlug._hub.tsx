import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { useMediaPropertyBySlug } from "../hooks/useMediaProperties";

export const Route = createFileRoute("/taxonomies/media-properties/$mediaPropertySlug/_hub")({
  component: MediaPropertyHubLayout,
});

function MediaPropertyHubLayout() {
  const {
    t,
  } = useTranslation();
  const {
    mediaPropertySlug,
  } = Route.useParams();
  const {
    mediaProperty, isLoading,
  } = useMediaPropertyBySlug(mediaPropertySlug);

  return (
    <ListingHubLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading ? t("Media property") : (mediaProperty?.name ?? t("Media property not found"))}
        </h1>
      )}
      tabs={[
        {
          to: "/taxonomies/media-properties/$mediaPropertySlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/media-properties/$mediaPropertySlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/media-properties/$mediaPropertySlug/media",
          label: t("Media"),
        },
        {
          to: "/taxonomies/media-properties/$mediaPropertySlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        mediaPropertySlug,
      }}
      navAriaLabel={t("Media property sections")}
    />
  );
}
