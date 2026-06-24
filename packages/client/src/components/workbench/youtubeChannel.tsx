/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { YouTubeChannel } from "@eesimple/types";

import { MonitorPlay } from "lucide-react";

import { EntityImagePreview } from "../EntityImageField";
import { SourceAutofillDefaults } from "../SourceAutofillDefaults";
import { YouTubeChannelAuthorsForm, YouTubeChannelAuthorsView } from "../YouTubeChannelAuthorsForm";
import { YouTubeChannelGeneralForm } from "../YouTubeChannelGeneralForm";
import { YouTubeChannelPublishersForm, YouTubeChannelPublishersView } from "../YouTubeChannelPublishersForm";
import { YouTubeChannelWebsitesForm, YouTubeChannelWebsitesView } from "../YouTubeChannelWebsitesForm";

import { useAuthors } from "@/hooks/useAuthors";
import { usePublishers } from "@/hooks/usePublishers";
import { useWebsites } from "@/hooks/useWebsites";
import { useDeleteYouTubeChannel, useYouTubeChannelBySlug, useYouTubeChannels } from "@/hooks/useYouTubeChannels";

function YouTubeChannelGeneralView({
  entity: ch,
}: {
  entity: YouTubeChannel;
}) {
  const {
    data: authors,
  } = useAuthors();
  const {
    data: websites,
  } = useWebsites();
  const {
    data: publishers,
  } = usePublishers();

  const connectedAuthors = (authors ?? []).filter(a => ch.authorIds.includes(a.id));
  const connectedWebsites = (websites ?? []).filter(site => ch.websiteIds.includes(site.id));
  const connectedPublishers = (publishers ?? []).filter(pub => ch.publisherIds.includes(pub.id));

  return (
    <div className="space-y-4">
      <EntityImagePreview
        imageUrl={ch.imageUrl}
        shape="circle"
        fallback={<MonitorPlay className="size-6" />}
      />
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(ch.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">Channel key</dt>
        <dd>{ch.channelKey}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{ch.slug}</dd>
        <dt className="text-muted-foreground">Self-identifiers</dt>
        <dd>
          {ch.selfIds.length > 0
            ? ch.selfIds.join(", ")
            : <span className="text-muted-foreground">None</span>}
        </dd>
        {ch.bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">Bookmarks</dt>
              <dd>{ch.bookmarkCount}</dd>
            </>
          )
          : null}
        {connectedAuthors.map(a => (
          <>
            <dt
              key={`author-label-${a.id}`}
              className="text-muted-foreground"
            >Author
            </dt>
            <dd key={`author-value-${a.id}`}>{a.name}</dd>
          </>
        ))}
        {connectedWebsites.map(site => (
          <>
            <dt
              key={`site-label-${site.id}`}
              className="text-muted-foreground"
            >Website
            </dt>
            <dd key={`site-value-${site.id}`}>{site.siteName}</dd>
          </>
        ))}
        {connectedPublishers.map(pub => (
          <>
            <dt
              key={`pub-label-${pub.id}`}
              className="text-muted-foreground"
            >Publisher
            </dt>
            <dd key={`pub-value-${pub.id}`}>{pub.name}</dd>
          </>
        ))}
      </dl>
      <SourceAutofillDefaults
        kind="channel"
        category={ch.category}
        mediaTypeId={ch.mediaTypeId}
        tagIds={ch.tagIds}
      />
    </div>
  );
}

/** Single source of truth for a YouTube channel's tabbed view/edit UI (main pane routes + right panel). */
export const youtubeChannelWorkbench: EntityWorkbench<YouTubeChannel> = {
  useBySlug: (slug) => {
    const {
      channel, isLoading,
    } = useYouTubeChannelBySlug(slug);
    return {
      entity: channel,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useYouTubeChannels();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: channel => channel.name,
  useDelete: () => {
    const mutation = useDeleteYouTubeChannel();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Channel not found.",
  navAriaLabel: "YouTube channel sections",
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Channel details.",
        render: YouTubeChannelGeneralView,
      },
      edit: {
        title: "General",
        description: "Channel name.",
        render: ({
          entity,
        }) => <YouTubeChannelGeneralForm channel={entity} />,
      },
    },
    {
      key: "authors",
      label: "Authors",
      view: {
        title: "Authors",
        description: "Authors associated with this channel.",
        render: ({
          entity,
        }) => <YouTubeChannelAuthorsView channel={entity} />,
      },
      edit: {
        title: "Authors",
        description: "Connect authors to this channel.",
        render: ({
          entity,
        }) => <YouTubeChannelAuthorsForm channel={entity} />,
      },
    },
    {
      key: "websites",
      label: "Websites",
      view: {
        title: "Websites",
        description: "Websites associated with this channel.",
        render: ({
          entity,
        }) => <YouTubeChannelWebsitesView channel={entity} />,
      },
      edit: {
        title: "Websites",
        description: "Connect websites to this channel.",
        render: ({
          entity,
        }) => <YouTubeChannelWebsitesForm channel={entity} />,
      },
    },
    {
      key: "publishers",
      label: "Publishers",
      view: {
        title: "Publishers",
        description: "Publishers associated with this channel.",
        render: ({
          entity,
        }) => <YouTubeChannelPublishersView channel={entity} />,
      },
      edit: {
        title: "Publishers",
        description: "Connect publishers to this channel.",
        render: ({
          entity,
        }) => <YouTubeChannelPublishersForm channel={entity} />,
      },
    },
  ],
};
