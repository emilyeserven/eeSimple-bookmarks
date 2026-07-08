/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, YouTubeChannel } from "@eesimple/types";

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

/**
 * The YouTube channel workbench's field registry (#1106 layout editor). Each existing tab pane
 * becomes ONE placeable, mode-aware {@link WorkbenchField} keyed by the tab's own key (#1165
 * composite-editor recipe) — `general` bundles the existing image preview + metadata + form
 * unchanged (an image-bearing entity's avatar stays part of its one composite field, per the "an
 * image/gallery manager registers as a single field" rule). Authored as an exhaustive
 * `Record<YouTubeChannelFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type YouTubeChannelFieldKey
  = | "general"
    | "autofillRules"
    | "displayRules"
    | "languages";

const youtubeChannelFields = {
  general: {
    key: "general",
    label: i18n.t("General"),
    view: YouTubeChannelGeneralView,
    edit: ({
      entity,
    }) => <YouTubeChannelGeneralForm channel={entity} />,
  },
  autofillRules: {
    key: "autofillRules",
    label: i18n.t("Autofill Rules"),
    view: ({
      entity,
    }) => (
      <AutofillRulesList
        channelId={entity.id}
        query=""
      />
    ),
    edit: ({
      entity,
    }) => (
      <AutofillRulesList
        channelId={entity.id}
        query=""
      />
    ),
  },
  displayRules: {
    key: "displayRules",
    label: i18n.t("Display Rules"),
    view: ({
      entity,
    }) => <CardDisplayRulesList channelId={entity.id} />,
    edit: ({
      entity,
    }) => <CardDisplayRulesList channelId={entity.id} />,
  },
  languages: {
    key: "languages",
    label: i18n.t("Languages"),
    view: ({
      entity,
    }) => (
      <LanguageUsagesTabView
        ownerType="youtubeChannel"
        ownerId={entity.id}
      />
    ),
    edit: ({
      entity,
    }) => (
      <LanguageUsagesTabEditor
        ownerType="youtubeChannel"
        ownerId={entity.id}
        kind="availability"
      />
    ),
  },
} satisfies Record<YouTubeChannelFieldKey, WorkbenchField<YouTubeChannel>>;

/** The code-defined default layout — the current tab list, one untitled section per tab. */
const YOUTUBE_CHANNEL_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["general"] satisfies YouTubeChannelFieldKey[],
      }],
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      sections: [{
        key: "autofill",
        fields: ["autofillRules"] satisfies YouTubeChannelFieldKey[],
      }],
    },
    {
      key: "display-rules",
      label: i18n.t("Display Rules"),
      sections: [{
        key: "display-rules",
        fields: ["displayRules"] satisfies YouTubeChannelFieldKey[],
      }],
    },
    {
      key: "languages",
      label: i18n.t("Languages"),
      sections: [{
        key: "languages",
        fields: ["languages"] satisfies YouTubeChannelFieldKey[],
      }],
    },
  ],
};

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
  layoutKind: "youtube-channel",
  fields: youtubeChannelFields,
  defaultLayout: YOUTUBE_CHANNEL_DEFAULT_LAYOUT,
  // Layout-driven: the tab rail + section stacks come from `fields` + `defaultLayout`. `tabs` is
  // retained only to carry the code-only `group` nav metadata (the "Rules" More dropdown on the
  // edit strip), re-attached by tab key in `deriveWorkbenchTabs`.
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      group: i18n.t("Rules"),
    },
    {
      key: "display-rules",
      label: i18n.t("Display Rules"),
      group: i18n.t("Rules"),
    },
    {
      key: "languages",
      label: i18n.t("Languages"),
    },
  ],
};
