import { createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useAlbumBySlug } from "../hooks/useAlbums";
import { albumsApi } from "../lib/api/taxonomies";

export const Route = createFileRoute("/taxonomies/albums/$albumSlug/_view")({
  component: AlbumViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/albums/$albumSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/albums/$albumSlug/image",
    label: "Image",
  },
] as const;

function AlbumViewLayout() {
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
            ? "Album"
            : album
              ? (
                <RomanizedLabel
                  name={album.name}
                  romanized={album.romanizedName}
                />
              )
              : "Album not found"}
        />
      )}
      nav={viewNav}
      params={{
        albumSlug,
      }}
      navAriaLabel="Album sections"
    />
  );
}
