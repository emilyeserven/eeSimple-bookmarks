/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { YouTubeChannel } from "@eesimple/types";

import { MonitorPlay } from "lucide-react";
import { useTranslation } from "react-i18next";

import i18n from "../../i18n";
import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { EntityImagePreview } from "../EntityImageField";
import { LanguageUsagesTabEditor, LanguageUsagesTabView } from "../languageUsages/LanguageUsagesTab";
import { SourceAutofillDefaults } from "../SourceAutofillDefaults";
import { YouTubeChannelGeneralForm } from "../YouTubeChannelGeneralForm";

import { useGroups } from "@/hooks/useGroups";
import { useDeleteYouTubeChannel, useYouTubeChannelBySlug, useYouTubeChannels } from "@/hooks/useYouTubeChannels";

function YouTubeChannelGeneralView({
  entity: ch,
}: {
  entity: YouTubeChannel;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: groups,
  } = useGroups();
  const connectedGroups = (groups ?? []).filter(group => (ch.groupIds ?? []).includes(group.id));

  return (
    <div className="space-y-4">
      <EntityImagePreview
        imageUrl={ch.imageUrl}
        shape="circle"
        fallback={<MonitorPlay className="size-6" />}
      />
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t("Added")}</dt>
        <dd>{new Date(ch.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">{t("Channel key")}</dt>
        <dd>{ch.channelKey}</dd>
        <dt className="text-muted-foreground">{t("Slug")}</dt>
        <dd className="font-mono">{ch.slug}</dd>
        {ch.description
          ? (
            <>
              <dt className="text-muted-foreground">{t("Description")}</dt>
              <dd>{ch.description}</dd>
            </>
          )
          : null}
        <dt className="text-muted-foreground">{t("Self-identifiers")}</dt>
        <dd>
          {ch.selfIds.length > 0
            ? ch.selfIds.join(", ")
            : <span className="text-muted-foreground">{t("None")}</span>}
        </dd>
        {ch.bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">{t("Bookmarks")}</dt>
              <dd>{ch.bookmarkCount}</dd>
            </>
          )
          : null}
        {connectedGroups.length > 0
          ? (
            <>
              <dt className="text-muted-foreground">{t("Groups")}</dt>
              <dd>{connectedGroups.map(group => group.name).join(", ")}</dd>
            </>
          )
          : null}
      </dl>
      <SourceAutofillDefaults
        kind="channel"
        category={ch.category}
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
  notFound: i18n.t("Channel not found."),
  navAriaLabel: i18n.t("YouTube channel sections"),
  listingPath: "/taxonomies/youtube-channels",
  getSlug: channel => channel.slug,
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      view: {
        title: i18n.t("General"),
        description: i18n.t("Channel details."),
        render: YouTubeChannelGeneralView,
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Channel name."),
        render: ({
          entity,
        }) => <YouTubeChannelGeneralForm channel={entity} />,
      },
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      view: {
        title: i18n.t("Autofill Rules"),
        description: i18n.t("Autofill rules whose conditions target this channel."),
        render: ({
          entity,
        }) => (
          <AutofillRulesList
            channelId={entity.id}
            query=""
          />
        ),
      },
      edit: {
        title: i18n.t("Autofill Rules"),
        description: i18n.t("Autofill rules whose conditions target this channel."),
        render: ({
          entity,
        }) => (
          <AutofillRulesList
            channelId={entity.id}
            query=""
          />
        ),
      },
    },
    {
      key: "display-rules",
      label: i18n.t("Display Rules"),
      view: {
        title: i18n.t("Display Rules"),
        description: i18n.t("Card display rules whose conditions reference this channel."),
        render: ({
          entity,
        }) => <CardDisplayRulesList channelId={entity.id} />,
      },
      edit: {
        title: i18n.t("Display Rules"),
        description: i18n.t("Card display rules whose conditions reference this channel."),
        render: ({
          entity,
        }) => <CardDisplayRulesList channelId={entity.id} />,
      },
    },
    {
      key: "languages",
      label: i18n.t("Languages"),
      view: {
        title: i18n.t("Languages"),
        description: i18n.t("Languages this channel's content is available in and how."),
        render: ({
          entity,
        }) => (
          <LanguageUsagesTabView
            ownerType="youtubeChannel"
            ownerId={entity.id}
          />
        ),
      },
      edit: {
        title: i18n.t("Languages"),
        description: i18n.t("Record which languages this channel offers (dub, subtitles, …)."),
        render: ({
          entity,
        }) => (
          <LanguageUsagesTabEditor
            ownerType="youtubeChannel"
            ownerId={entity.id}
            kind="availability"
          />
        ),
      },
    },
  ],
};
