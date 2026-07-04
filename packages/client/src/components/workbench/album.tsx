import type { EntityWorkbench } from "./types";
import type { Album } from "@eesimple/types";

import { AlbumCreditsValue } from "../AlbumCreditsSection";
import { AlbumGeneralForm } from "../AlbumGeneralForm";
import { PlexTaxonomyImageTab } from "../PlexTaxonomyImageTab";
import { PlexTitleGeneralView } from "../PlexTitleGeneralView";

import { useAlbumBySlug, useAlbums, useDeleteAlbum } from "@/hooks/useAlbums";
import { albumsApi } from "@/lib/api/taxonomies";

/** Single source of truth for an album's view/edit UI (main pane routes + right panel). */
export const albumWorkbench: EntityWorkbench<Album> = {
  useBySlug: (slug) => {
    const {
      album, isLoading,
    } = useAlbumBySlug(slug);
    return {
      entity: album,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useAlbums();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: album => album.name,
  useDelete: () => {
    const mutation = useDeleteAlbum();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Album not found.",
  navAriaLabel: "Album sections",
  listingPath: "/taxonomies/albums",
  getSlug: album => album.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Media property, credits, Plex link, year, and metadata.",
        render: ({
          entity,
        }) => (
          <PlexTitleGeneralView
            entity={entity}
            ownerType="album"
            createdAt={entity.createdAt}
            bookmarkCount={entity.bookmarkCount}
            renderExtra={<AlbumCreditsValue album={entity} />}
          />
        ),
      },
      edit: {
        title: "General",
        description: "Name, media property, credits, Plex link, and year.",
        render: ({
          entity,
        }) => <AlbumGeneralForm album={entity} />,
      },
    },
    {
      key: "image",
      label: "Image",
      view: {
        title: "Image",
        description: "The album's cover image.",
        render: ({
          entity,
        }) => (
          <PlexTaxonomyImageTab
            entity={entity}
            imagesApi={albumsApi.images}
            queryKeyPrefix="album-images"
            readOnly
          />
        ),
      },
      edit: {
        title: "Image",
        description: "Upload a cover image, or pull it from the linked Plex item.",
        render: ({
          entity,
        }) => (
          <PlexTaxonomyImageTab
            entity={entity}
            imagesApi={albumsApi.images}
            queryKeyPrefix="album-images"
          />
        ),
      },
    },
  ],
};
