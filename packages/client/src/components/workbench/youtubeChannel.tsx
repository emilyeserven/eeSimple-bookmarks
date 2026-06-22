/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { YouTubeChannel } from "@eesimple/types";

import { MonitorPlay } from "lucide-react";

import { AutofillRulesList } from "../AutofillRulesList";
import { EntityImagePreview } from "../EntityImageField";
import { SourceAutofillDefaults } from "../SourceAutofillDefaults";
import { YouTubeChannelGeneralForm } from "../YouTubeChannelGeneralForm";

import { useDeleteYouTubeChannel, useYouTubeChannelBySlug, useYouTubeChannels } from "@/hooks/useYouTubeChannels";

function YouTubeChannelGeneralView({
  entity: ch,
}: {
  entity: YouTubeChannel;
}) {
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

function YouTubeChannelAutofillView({
  entity: ch,
}: {
  entity: YouTubeChannel;
}) {
  return (
    <div className="space-y-6">
      <SourceAutofillDefaults
        kind="channel"
        category={ch.category}
        mediaTypeId={ch.mediaTypeId}
        tagIds={ch.tagIds}
      />
      <AutofillRulesList channelId={ch.id} />
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
      key: "autofill",
      label: "Autofill Rules",
      view: {
        title: "Autofill Rules",
        description: "Autofill rules that target this YouTube channel.",
        render: YouTubeChannelAutofillView,
      },
      edit: {
        title: "Autofill Rules",
        description: "Autofill rules that target this YouTube channel. New rules created here target this channel by default.",
        render: YouTubeChannelAutofillView,
      },
    },
  ],
};
