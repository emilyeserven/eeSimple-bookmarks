import type { EntityWorkbench } from "./types";
import type { Artist } from "@eesimple/types";

import { ArtistAlbumsValue } from "../ArtistAlbumsSection";
import { ArtistGeneralForm } from "../ArtistGeneralForm";
import { PlexTaxonomyImageTab } from "../PlexTaxonomyImageTab";
import { PlexTitleGeneralView } from "../PlexTitleGeneralView";

import { useArtistBySlug, useArtists, useDeleteArtist } from "@/hooks/useArtists";
import { artistsApi } from "@/lib/api/taxonomies";

/** Single source of truth for an artist's view/edit UI (main pane routes + right panel). */
export const artistWorkbench: EntityWorkbench<Artist> = {
  useBySlug: (slug) => {
    const {
      artist, isLoading,
    } = useArtistBySlug(slug);
    return {
      entity: artist,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useArtists();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: artist => artist.name,
  useDelete: () => {
    const mutation = useDeleteArtist();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Artist not found.",
  navAriaLabel: "Artist sections",
  getSlug: artist => artist.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Media property, albums, Plex link, year, and metadata.",
        render: ({
          entity,
        }) => (
          <PlexTitleGeneralView
            entity={entity}
            createdAt={entity.createdAt}
            bookmarkCount={entity.bookmarkCount}
            renderExtra={<ArtistAlbumsValue artist={entity} />}
          />
        ),
      },
      edit: {
        title: "General",
        description: "Name, media property, albums, Plex link, and year.",
        render: ({
          entity,
        }) => <ArtistGeneralForm artist={entity} />,
      },
    },
    {
      key: "image",
      label: "Image",
      view: {
        title: "Image",
        description: "The artist's image.",
        render: ({
          entity,
        }) => (
          <PlexTaxonomyImageTab
            entity={entity}
            imagesApi={artistsApi.images}
            queryKeyPrefix="artist-images"
            readOnly
          />
        ),
      },
      edit: {
        title: "Image",
        description: "Upload an image, or pull it from the linked Plex item.",
        render: ({
          entity,
        }) => (
          <PlexTaxonomyImageTab
            entity={entity}
            imagesApi={artistsApi.images}
            queryKeyPrefix="artist-images"
          />
        ),
      },
    },
  ],
};
