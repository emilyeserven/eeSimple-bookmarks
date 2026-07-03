import type { EntityWorkbench } from "./types";
import type { Track } from "@eesimple/types";

import { PlexTaxonomyImageTab } from "../PlexTaxonomyImageTab";
import { PlexTitleGeneralView } from "../PlexTitleGeneralView";
import { TrackAlbumValue } from "../TrackAlbumField";
import { TrackGeneralForm } from "../TrackGeneralForm";

import { useDeleteTrack, useTrackBySlug, useTracks } from "@/hooks/useTracks";
import { tracksApi } from "@/lib/api/taxonomies";

/** Single source of truth for a track's view/edit UI (main pane routes + right panel). */
export const trackWorkbench: EntityWorkbench<Track> = {
  useBySlug: (slug) => {
    const {
      track, isLoading,
    } = useTrackBySlug(slug);
    return {
      entity: track,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useTracks();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: track => track.name,
  useDelete: () => {
    const mutation = useDeleteTrack();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Track not found.",
  navAriaLabel: "Track sections",
  listingPath: "/taxonomies/tracks",
  getSlug: track => track.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Media property, album, Plex link, year, and metadata.",
        render: ({
          entity,
        }) => (
          <PlexTitleGeneralView
            entity={entity}
            createdAt={entity.createdAt}
            bookmarkCount={entity.bookmarkCount}
            renderExtra={<TrackAlbumValue track={entity} />}
          />
        ),
      },
      edit: {
        title: "General",
        description: "Name, media property, album, Plex link, and year.",
        render: ({
          entity,
        }) => <TrackGeneralForm track={entity} />,
      },
    },
    {
      key: "image",
      label: "Image",
      view: {
        title: "Image",
        description: "The track's cover image.",
        render: ({
          entity,
        }) => (
          <PlexTaxonomyImageTab
            entity={entity}
            imagesApi={tracksApi.images}
            queryKeyPrefix="track-images"
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
            imagesApi={tracksApi.images}
            queryKeyPrefix="track-images"
          />
        ),
      },
    },
  ],
};
