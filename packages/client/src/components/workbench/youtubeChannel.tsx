/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, YouTubeChannel } from "@eesimple/types";

import { channelUrlFromKey } from "@eesimple/types";
import { MonitorPlay } from "lucide-react";
import { useTranslation } from "react-i18next";

import i18n from "../../i18n";
import { AutofillRulesList } from "../AutofillRulesList";
import { EntityImagePreview } from "../EntityImageField";
import { LanguageUsagesTabEditor, LanguageUsagesTabView } from "../languageUsages/LanguageUsagesTab";
import { SourceAutofillDefaults } from "../SourceAutofillDefaults";
import {
  YouTubeChannelCategoryEdit,
  YouTubeChannelDescriptionEdit,
  YouTubeChannelGenreMoodEdit,
  YouTubeChannelGroupsEdit,
  YouTubeChannelLabeledWebsitesEdit,
  YouTubeChannelNameField,
  YouTubeChannelSelfIdsEdit,
  YouTubeChannelTagsEdit,
  YouTubeChannelWebsitesEdit,
  YouTubeChannelAvatarField,
} from "../YouTubeChannelGeneralForm";

import { useGroups } from "@/hooks/useGroups";
import { useDeleteYouTubeChannel, useYouTubeChannelBySlug, useYouTubeChannels } from "@/hooks/useYouTubeChannels";

/** Read-only avatar preview — the `avatar` field's view renderer. */
function YouTubeChannelAvatarView({
  entity: ch,
}: {
  entity: YouTubeChannel;
}) {
  return (
    <EntityImagePreview
      imageUrl={ch.imageUrl}
      shape="circle"
      fallback={<MonitorPlay className="size-6" />}
    />
  );
}

/** Read-only system metadata (Added / Channel key / URL / Slug / Bookmarks) — the `metadata` field's view. */
function YouTubeChannelMetadataView({
  entity: ch,
}: {
  entity: YouTubeChannel;
}) {
  const {
    t,
  } = useTranslation();
  const channelUrl = channelUrlFromKey(ch.channelKey);
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">{t("Added")}</dt>
      <dd>{new Date(ch.createdAt).toLocaleDateString()}</dd>
      <dt className="text-muted-foreground">{t("Channel key")}</dt>
      <dd>{ch.channelKey}</dd>
      <dt className="text-muted-foreground">{t("URL")}</dt>
      <dd>
        <a
          href={channelUrl}
          target="_blank"
          rel="noreferrer"
          className="
            break-all text-primary
            hover:underline
          "
        >
          {channelUrl}
        </a>
      </dd>
      <dt className="text-muted-foreground">{t("Slug")}</dt>
      <dd className="font-mono">{ch.slug}</dd>
      {ch.bookmarkCount != null
        ? (
          <>
            <dt className="text-muted-foreground">{t("Bookmarks")}</dt>
            <dd>{ch.bookmarkCount}</dd>
          </>
        )
        : null}
    </dl>
  );
}

/** Read-only self-identifiers row — the `selfIds` field's view renderer. */
function YouTubeChannelSelfIdsView({
  entity: ch,
}: {
  entity: YouTubeChannel;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">{t("Self-identifiers")}</dt>
      <dd>
        {ch.selfIds.length > 0
          ? ch.selfIds.join(", ")
          : <span className="text-muted-foreground">{t("None")}</span>}
      </dd>
    </dl>
  );
}

/** Read-only connected-groups row — the `channelGroups` field's view renderer (hidden when none). */
function YouTubeChannelGroupsView({
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
  if (connectedGroups.length === 0) return null;
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">{t("Groups")}</dt>
      <dd>{connectedGroups.map(group => group.name).join(", ")}</dd>
    </dl>
  );
}

/**
 * The YouTube channel workbench's field registry (#1106 layout editor). The old opaque `general`
 * composite is atomized into granular, independently-placeable {@link WorkbenchField}s (#1192,
 * mirroring Newsletter): `name`/`category`/`tags`/`channelWebsites`/`labeledWebsites`/`genreMoods` are
 * **edit-only**, `metadata`/`sourceDefaults` are **view-only**, and `description`/`avatar`/`selfIds`/
 * `channelGroups` carry both — the mode picks the renderer, so view/edit parity is by construction. Each
 * edit renderer independently calls `useYouTubeChannelGeneralForm` (no shared form-context provider is
 * needed — auto-save is per field, the Category/Newsletter precedent). Authored as an exhaustive
 * `Record<YouTubeChannelFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type YouTubeChannelFieldKey
  = | "name"
    | "description"
    | "avatar"
    | "metadata"
    | "sourceDefaults"
    | "category"
    | "selfIds"
    | "tags"
    | "channelWebsites"
    | "channelGroups"
    | "labeledWebsites"
    | "genreMoods"
    | "autofillRules"
    | "languages";

const youtubeChannelFields = {
  name: {
    key: "name",
    label: i18n.t("Channel name"),
    edit: ({
      entity,
    }) => <YouTubeChannelNameField channel={entity} />,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    view: ({
      entity,
    }) => (entity.description
      ? <p className="text-sm text-muted-foreground">{entity.description}</p>
      : null),
    edit: ({
      entity,
    }) => <YouTubeChannelDescriptionEdit channel={entity} />,
  },
  avatar: {
    key: "avatar",
    label: i18n.t("Avatar"),
    view: YouTubeChannelAvatarView,
    edit: ({
      entity,
    }) => <YouTubeChannelAvatarField channel={entity} />,
  },
  metadata: {
    key: "metadata",
    label: i18n.t("Details"),
    view: YouTubeChannelMetadataView,
  },
  sourceDefaults: {
    key: "sourceDefaults",
    label: i18n.t("Defaults"),
    view: ({
      entity,
    }) => (
      <SourceAutofillDefaults
        kind="channel"
        category={entity.category}
        tagIds={entity.tagIds}
      />
    ),
  },
  category: {
    key: "category",
    label: i18n.t("Default category"),
    edit: ({
      entity,
    }) => <YouTubeChannelCategoryEdit channel={entity} />,
  },
  selfIds: {
    key: "selfIds",
    label: i18n.t("Self-identifiers"),
    view: YouTubeChannelSelfIdsView,
    edit: ({
      entity,
    }) => <YouTubeChannelSelfIdsEdit channel={entity} />,
  },
  tags: {
    key: "tags",
    label: i18n.t("Default tags"),
    edit: ({
      entity,
    }) => <YouTubeChannelTagsEdit channel={entity} />,
  },
  channelWebsites: {
    key: "channelWebsites",
    label: i18n.t("Associated websites"),
    edit: ({
      entity,
    }) => <YouTubeChannelWebsitesEdit channel={entity} />,
  },
  channelGroups: {
    key: "channelGroups",
    label: i18n.t("Groups"),
    view: YouTubeChannelGroupsView,
    edit: ({
      entity,
    }) => <YouTubeChannelGroupsEdit channel={entity} />,
  },
  labeledWebsites: {
    key: "labeledWebsites",
    label: i18n.t("Labeled websites"),
    edit: ({
      entity,
    }) => <YouTubeChannelLabeledWebsitesEdit channel={entity} />,
  },
  genreMoods: {
    key: "genreMoods",
    label: i18n.t("Genres & moods"),
    edit: ({
      entity,
    }) => <YouTubeChannelGenreMoodEdit channel={entity} />,
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

/**
 * The code-defined default layout. The `general` tab now holds the granular field keys (in the current
 * form order, so the edit surface stays byte-identical); the other three tabs keep one field each.
 */
const YOUTUBE_CHANNEL_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: [
          "name",
          "description",
          "avatar",
          "metadata",
          "sourceDefaults",
          "category",
          "selfIds",
          "tags",
          "channelWebsites",
          "channelGroups",
          "labeledWebsites",
          "genreMoods",
        ] satisfies YouTubeChannelFieldKey[],
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
    },
    {
      key: "languages",
      label: i18n.t("Languages"),
    },
  ],
};
