import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useAlbumBySlug } from "../hooks/useAlbums";
import i18n from "../i18n";
import { albumsApi } from "../lib/api/taxonomies";

export const Route = createFileRoute("/taxonomies/albums/$albumSlug/_view")({
  component: AlbumViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/albums/$albumSlug/general",
    label: i18n.t("General"),
  },
  {
    to: "/taxonomies/albums/$albumSlug/image",
    label: i18n.t("Image"),
  },
] as const;

function AlbumViewLayout() {
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
        <TaxonomyViewHeader
          image={{
            kind: "taxonomyImages",
            ownerId: album?.id,
            imagesApi: albumsApi.images,
            queryKeyPrefix: "album-images",
          }}
          title={isLoading
            ? t("Album")
            : album
              ? (
                <LocalizedNameLabel
                  names={album.names ?? []}
                  base={album.name}
                />
              )
              : t("Album not found")}
        />
      )}
      nav={viewNav}
      params={{
        albumSlug,
      }}
      navAriaLabel={t("Album sections")}
    />
  );
}
