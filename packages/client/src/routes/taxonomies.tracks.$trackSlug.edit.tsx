import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useTrackBySlug } from "../hooks/useTracks";

import i18n from "@/i18n";

export const Route = createFileRoute("/taxonomies/tracks/$trackSlug/edit")({
  component: TrackEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/tracks/$trackSlug/edit/general",
    label: i18n.t("General"),
  },
  {
    to: "/taxonomies/tracks/$trackSlug/edit/image",
    label: i18n.t("Image"),
  },
] as const;

function TrackEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    trackSlug,
  } = Route.useParams();
  const {
    track, isLoading,
  } = useTrackBySlug(trackSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/tracks/$trackSlug"
            params={{
              trackSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("track") : (track?.name ?? t("track")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit track")}</h1>
        </div>
      )}
      nav={editNav}
      params={{
        trackSlug,
      }}
      navAriaLabel={t("Track edit sections")}
    />
  );
}
