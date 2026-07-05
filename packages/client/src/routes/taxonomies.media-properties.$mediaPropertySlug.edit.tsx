import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useMediaPropertyBySlug } from "../hooks/useMediaProperties";

export const Route = createFileRoute("/taxonomies/media-properties/$mediaPropertySlug/edit")({
  component: MediaPropertyEditLayout,
});

function MediaPropertyEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    mediaPropertySlug,
  } = Route.useParams();
  const {
    mediaProperty, isLoading,
  } = useMediaPropertyBySlug(mediaPropertySlug);
  const editNav = [
    {
      to: "/taxonomies/media-properties/$mediaPropertySlug/edit/general",
      label: t("General"),
    },
  ] as const;

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/media-properties/$mediaPropertySlug"
            params={{
              mediaPropertySlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("media property") : (mediaProperty?.name ?? t("media property")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit media property")}</h1>
        </div>
      )}
      nav={editNav}
      params={{
        mediaPropertySlug,
      }}
      navAriaLabel={t("Media property edit sections")}
    />
  );
}
