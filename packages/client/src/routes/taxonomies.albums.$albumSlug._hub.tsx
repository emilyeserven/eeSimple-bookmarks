import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useAlbumBySlug } from "../hooks/useAlbums";
import { albumsApi } from "../lib/api/taxonomies";

/**
 * The album listing shell: the entity header over the `Bookmarks | Gallery | Media | Info` strip,
 * shared by the bookmarks/gallery/media panes and the Info page. `edit` is a sibling of this pathless
 * layout, so the strip never shows while editing.
 */
export const Route = createFileRoute("/taxonomies/albums/$albumSlug/_hub")({
  component: AlbumHubLayout,
});

function AlbumHubLayout() {
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
    <ListingHubLayout
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
      tabs={[
        {
          to: "/taxonomies/albums/$albumSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/albums/$albumSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/albums/$albumSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        albumSlug,
      }}
      navAriaLabel={t("Album sections")}
    />
  );
}
