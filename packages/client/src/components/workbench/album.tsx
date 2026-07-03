import type { EntityWorkbench } from "./types";
import type { Album } from "@eesimple/types";

import { AlbumArtistsValue } from "../AlbumArtistsSection";
import { AlbumGeneralForm } from "../AlbumGeneralForm";
import { PlexTitleGeneralView } from "../PlexTitleGeneralView";

import { useAlbumBySlug, useAlbums, useDeleteAlbum } from "@/hooks/useAlbums";

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
  getSlug: album => album.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Media property, artists, Plex link, year, and metadata.",
        render: ({
          entity,
        }) => (
          <PlexTitleGeneralView
            entity={entity}
            createdAt={entity.createdAt}
            bookmarkCount={entity.bookmarkCount}
            renderExtra={<AlbumArtistsValue album={entity} />}
          />
        ),
      },
      edit: {
        title: "General",
        description: "Name, media property, artists, Plex link, and year.",
        render: ({
          entity,
        }) => <AlbumGeneralForm album={entity} />,
      },
    },
  ],
};
