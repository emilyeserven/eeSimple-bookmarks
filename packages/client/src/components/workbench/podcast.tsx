/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { Podcast } from "@eesimple/types";

import { PodcastGeneralForm } from "../PodcastGeneralForm";
import { PodcastImageTab } from "../PodcastImageTab";

import { useMediaProperties } from "@/hooks/useMediaProperties";
import { useDeletePodcast, usePodcastBySlug, usePodcasts } from "@/hooks/usePodcasts";

function PodcastGeneralView({
  entity: podcast,
}: {
  entity: Podcast;
}) {
  const {
    data: mediaProperties,
  } = useMediaProperties();
  const mediaProperty = podcast.mediaPropertyId
    ? (mediaProperties ?? []).find(prop => prop.id === podcast.mediaPropertyId)
    : undefined;

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(podcast.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{podcast.slug}</dd>
        <dt className="text-muted-foreground">Media property</dt>
        <dd>{mediaProperty?.name ?? <span className="text-muted-foreground">None</span>}</dd>
        <dt className="text-muted-foreground">Author</dt>
        <dd>{podcast.author ?? <span className="text-muted-foreground">Unknown</span>}</dd>
        <dt className="text-muted-foreground">Feed URL</dt>
        <dd>
          {podcast.feedUrl
            ? (
              <a
                href={podcast.feedUrl}
                target="_blank"
                rel="noreferrer"
                className="
                  break-all
                  hover:underline
                "
              >
                {podcast.feedUrl}
              </a>
            )
            : <span className="text-muted-foreground">None</span>}
        </dd>
        {podcast.itunesUrl
          ? (
            <>
              <dt className="text-muted-foreground">Apple Podcasts</dt>
              <dd>
                <a
                  href={podcast.itunesUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  View on Apple Podcasts
                </a>
              </dd>
            </>
          )
          : null}
        <dt className="text-muted-foreground">Sort order</dt>
        <dd>{podcast.sortOrder}</dd>
        {podcast.bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">Bookmarks</dt>
              <dd>{podcast.bookmarkCount}</dd>
            </>
          )
          : null}
      </dl>
    </div>
  );
}

/** Single source of truth for a podcast's view/edit UI (main pane routes + right panel). */
export const podcastWorkbench: EntityWorkbench<Podcast> = {
  useBySlug: (slug) => {
    const {
      podcast, isLoading,
    } = usePodcastBySlug(slug);
    return {
      entity: podcast,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = usePodcasts();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: podcast => podcast.name,
  useDelete: () => {
    const mutation = useDeletePodcast();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Podcast not found.",
  navAriaLabel: "Podcast sections",
  getSlug: podcast => podcast.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Media property, feed, author, and metadata.",
        render: PodcastGeneralView,
      },
      edit: {
        title: "General",
        description: "Name, media property, feed URL, author, and description.",
        render: ({
          entity,
        }) => <PodcastGeneralForm podcast={entity} />,
      },
    },
    {
      key: "image",
      label: "Image",
      view: {
        title: "Image",
        description: "The podcast's artwork.",
        render: ({
          entity,
        }) => (
          <PodcastImageTab
            podcast={entity}
            readOnly
          />
        ),
      },
      edit: {
        title: "Image",
        description: "Upload artwork, or import it from the podcast's feed.",
        render: ({
          entity,
        }) => <PodcastImageTab podcast={entity} />,
      },
    },
  ],
};
