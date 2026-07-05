import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useAlbumBySlug } from "../hooks/useAlbums";
import i18n from "../i18n";

export const Route = createFileRoute("/taxonomies/albums/$albumSlug/edit")({
  component: AlbumEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/albums/$albumSlug/edit/general",
    label: i18n.t("General"),
  },
  {
    to: "/taxonomies/albums/$albumSlug/edit/image",
    label: i18n.t("Image"),
  },
] as const;

function AlbumEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    albumSlug,
  } = Route.useParams();
  const {
    album, isLoading,
  } = useAlbumBySlug(albumSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/albums/$albumSlug"
            params={{
              albumSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("album") : (album?.name ?? t("album")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit album")}</h1>
        </div>
      )}
      nav={editNav}
      params={{
        albumSlug,
      }}
      navAriaLabel={t("Album edit sections")}
    />
  );
}
