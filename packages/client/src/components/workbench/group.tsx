/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, Group } from "@eesimple/types";

import { Fragment } from "react";

import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import i18n from "../../i18n";
import { EntityImagePreview } from "../EntityImageField";
import { EntityNamesTabView, PrimaryLanguageDlRow } from "../entityNames/EntityNamesTab";
import {
  GroupConnectedYouTubeChannelsEditField,
  GroupCreatorMediaEditField,
  GroupDescriptionEditField,
  GroupGenreMoodEditField,
  GroupImageEditField,
  GroupLabeledWebsitesEditField,
  GroupNameEditField,
  GroupNamesEditField,
  GroupPrimaryLanguageEditField,
  GroupSocialLinksEditField,
  GroupTypeEditField,
} from "../GroupGeneralForm";
import { GroupPeopleForm, GroupPeopleView } from "../GroupPeopleForm";
import { GroupWebsitesForm, GroupWebsitesView } from "../GroupWebsitesForm";
import { GroupYouTubeChannelsForm, GroupYouTubeChannelsView } from "../GroupYouTubeChannelsForm";

import { useDeleteGroup, useGroupBySlug, useGroups } from "@/hooks/useGroups";
import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { SOCIAL_MEDIA_PLATFORM_LABELS } from "@/lib/socialLinks";

/** Shared field-grid class for the read-only `dt`/`dd` rows below. */
const DL_CLASS = "grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm";

/** Avatar/poster preview (the `image` field's view). */
function GroupImageView({
  entity: group,
}: {
  entity: Group;
}) {
  return (
    <EntityImagePreview
      imageUrl={group.imageUrl}
      fallback={<Building2 className="size-6" />}
    />
  );
}

/** Read-only metadata (Added / Slug / Bookmarks) — the view-only `metadata` field. */
function GroupMetadataView({
  entity: group,
}: {
  entity: Group;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <dl className={DL_CLASS}>
      <dt className="text-muted-foreground">{t("Added")}</dt>
      <dd>{new Date(group.createdAt).toLocaleDateString()}</dd>
      <dt className="text-muted-foreground">{t("Slug")}</dt>
      <dd className="font-mono">{group.slug}</dd>
      {group.bookmarkCount != null
        ? (
          <>
            <dt className="text-muted-foreground">{t("Bookmarks")}</dt>
            <dd>{group.bookmarkCount}</dd>
          </>
        )
        : null}
    </dl>
  );
}

/** Description row (the `description` field's view) — omitted when empty. */
function GroupDescriptionView({
  entity: group,
}: {
  entity: Group;
}) {
  const {
    t,
  } = useTranslation();
  if (!group.description) return null;
  return (
    <dl className={DL_CLASS}>
      <dt className="text-muted-foreground">{t("Description")}</dt>
      <dd>{group.description}</dd>
    </dl>
  );
}

/** Primary-language row (the `primaryLanguage` field's view). */
function GroupPrimaryLanguageView({
  entity: group,
}: {
  entity: Group;
}) {
  return (
    <dl className={DL_CLASS}>
      <PrimaryLanguageDlRow
        ownerType="group"
        ownerId={group.id}
      />
    </dl>
  );
}

/** Additional-names row (the `names` field's view). */
function GroupNamesView({
  entity: group,
}: {
  entity: Group;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <dl className={DL_CLASS}>
      <dt className="text-muted-foreground">{t("Names")}</dt>
      <dd>
        <EntityNamesTabView
          ownerType="group"
          ownerId={group.id}
        />
      </dd>
    </dl>
  );
}

/** Group-type row (the `groupType` field's view). */
function GroupTypeView({
  entity: group,
}: {
  entity: Group;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <dl className={DL_CLASS}>
      <dt className="text-muted-foreground">{t("Group type")}</dt>
      <dd>{group.groupType?.name ?? <span className="text-muted-foreground">{t("None")}</span>}</dd>
    </dl>
  );
}

/** Labeled-websites rows (the `labeledWebsites` field's view) — omitted when empty. */
function GroupLabeledWebsitesView({
  entity: group,
}: {
  entity: Group;
}) {
  const {
    t,
  } = useTranslation();
  if (group.labeledWebsites.length === 0) return null;
  return (
    <dl className={DL_CLASS}>
      {group.labeledWebsites.map((site, index) => (
        <Fragment key={index}>
          <dt className="text-muted-foreground">
            {site.label.trim().length > 0 ? site.label : t("Website")}
          </dt>
          <dd>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {site.url}
            </a>
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

/** Connected-YouTube-channels row (the `connectedYoutubeChannels` field's view) — omitted when empty. */
function GroupConnectedYouTubeChannelsView({
  entity: group,
}: {
  entity: Group;
}) {
  const {
    data: youtubeChannels,
  } = useYouTubeChannels();
  const {
    t,
  } = useTranslation();
  const connectedChannels = (youtubeChannels ?? []).filter(ch => group.youtubeChannelIds.includes(ch.id));
  if (connectedChannels.length === 0) return null;
  return (
    <dl className={DL_CLASS}>
      <dt className="text-muted-foreground">{t("YouTube channels")}</dt>
      <dd className="flex flex-wrap gap-2">
        {connectedChannels.map(ch => (
          <Link
            key={ch.id}
            to="/taxonomies/youtube-channels/$channelSlug"
            params={{
              channelSlug: ch.slug,
            }}
            className="
              text-primary
              hover:underline
            "
          >
            {ch.name}
          </Link>
        ))}
      </dd>
    </dl>
  );
}

/** Social-links rows (the `socialLinks` field's view) — omitted when empty. */
function GroupSocialLinksView({
  entity: group,
}: {
  entity: Group;
}) {
  if (group.socialLinks.length === 0) return null;
  return (
    <dl className={DL_CLASS}>
      {group.socialLinks.map(link => (
        <Fragment key={link.platform}>
          <dt className="text-muted-foreground">
            {SOCIAL_MEDIA_PLATFORM_LABELS[link.platform]}
          </dt>
          <dd>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {link.url}
            </a>
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

/** Year + Plex rows (the `creatorMedia` field's view) — omitted when both are empty. */
function GroupCreatorMediaView({
  entity: group,
}: {
  entity: Group;
}) {
  const {
    t,
  } = useTranslation();
  if (group.year == null && group.plexItemTitle == null) return null;
  return (
    <dl className={DL_CLASS}>
      {group.year != null
        ? (
          <>
            <dt className="text-muted-foreground">{t("Year")}</dt>
            <dd>{group.year}</dd>
          </>
        )
        : null}
      {group.plexItemTitle != null
        ? (
          <>
            <dt className="text-muted-foreground">{t("Plex")}</dt>
            <dd>{group.plexItemTitle}</dd>
          </>
        )
        : null}
    </dl>
  );
}

/**
 * The group workbench's field registry (#1106 layout editor). The old coarse `general` composite is
 * atomized into granular, placeable {@link WorkbenchField}s (#1195, mirroring the bookmark/newsletter
 * split) so an operator can rearrange them in Settings → Display → Page Layouts. The mode picks the
 * `view`/`edit` renderer, so parity is by construction: `name`/`genreMoods` are **edit-only**, `metadata`
 * is **view-only**, and the rest carry both. `creatorMedia` (Year + Plex, shared with Person via
 * `CreatorMediaSection`) stays **one** field. `people`/`youtubeChannels`/`websites` remain their own tabs.
 * `connectedYoutubeChannels` (the General-tab multi-select over `youtubeChannelIds`) is deliberately a
 * distinct key from the `youtubeChannels` tab. Authored as an exhaustive `Record<GroupFieldKey, …>` so a
 * key without a renderer fails `tsc`.
 */
type GroupFieldKey
  = | "image"
    | "metadata"
    | "name"
    | "description"
    | "primaryLanguage"
    | "names"
    | "groupType"
    | "labeledWebsites"
    | "connectedYoutubeChannels"
    | "socialLinks"
    | "creatorMedia"
    | "genreMoods"
    | "people"
    | "youtubeChannels"
    | "websites";

const groupFields = {
  image: {
    key: "image",
    label: i18n.t("Image"),
    view: GroupImageView,
    edit: ({
      entity,
    }) => <GroupImageEditField group={entity} />,
  },
  metadata: {
    key: "metadata",
    label: i18n.t("Details"),
    view: GroupMetadataView,
  },
  name: {
    key: "name",
    label: i18n.t("Name"),
    edit: ({
      entity,
    }) => <GroupNameEditField group={entity} />,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    view: GroupDescriptionView,
    edit: ({
      entity,
    }) => <GroupDescriptionEditField group={entity} />,
  },
  primaryLanguage: {
    key: "primaryLanguage",
    label: i18n.t("Primary language"),
    view: GroupPrimaryLanguageView,
    edit: ({
      entity,
    }) => <GroupPrimaryLanguageEditField group={entity} />,
  },
  names: {
    key: "names",
    label: i18n.t("Names"),
    view: GroupNamesView,
    edit: ({
      entity,
    }) => <GroupNamesEditField group={entity} />,
  },
  groupType: {
    key: "groupType",
    label: i18n.t("Group type"),
    view: GroupTypeView,
    edit: ({
      entity,
    }) => <GroupTypeEditField group={entity} />,
  },
  labeledWebsites: {
    key: "labeledWebsites",
    label: i18n.t("Websites"),
    view: GroupLabeledWebsitesView,
    edit: ({
      entity,
    }) => <GroupLabeledWebsitesEditField group={entity} />,
  },
  connectedYoutubeChannels: {
    key: "connectedYoutubeChannels",
    label: i18n.t("YouTube channels"),
    view: GroupConnectedYouTubeChannelsView,
    edit: ({
      entity,
    }) => <GroupConnectedYouTubeChannelsEditField group={entity} />,
  },
  socialLinks: {
    key: "socialLinks",
    label: i18n.t("Social media links"),
    view: GroupSocialLinksView,
    edit: ({
      entity,
    }) => <GroupSocialLinksEditField group={entity} />,
  },
  creatorMedia: {
    key: "creatorMedia",
    label: i18n.t("Creator / media"),
    view: GroupCreatorMediaView,
    edit: ({
      entity,
    }) => <GroupCreatorMediaEditField group={entity} />,
  },
  genreMoods: {
    key: "genreMoods",
    label: i18n.t("Genres & moods"),
    edit: ({
      entity,
    }) => <GroupGenreMoodEditField group={entity} />,
  },
  people: {
    key: "people",
    label: i18n.t("People"),
    view: ({
      entity,
    }) => <GroupPeopleView group={entity} />,
    edit: ({
      entity,
    }) => <GroupPeopleForm group={entity} />,
  },
  youtubeChannels: {
    key: "youtubeChannels",
    label: i18n.t("YouTube Channels"),
    view: ({
      entity,
    }) => <GroupYouTubeChannelsView group={entity} />,
    edit: ({
      entity,
    }) => <GroupYouTubeChannelsForm group={entity} />,
  },
  websites: {
    key: "websites",
    label: i18n.t("Websites"),
    view: ({
      entity,
    }) => <GroupWebsitesView group={entity} />,
    edit: ({
      entity,
    }) => <GroupWebsitesForm group={entity} />,
  },
} satisfies Record<GroupFieldKey, WorkbenchField<Group>>;

/**
 * The code default layout: the current four tabs. The General tab lists the atomized fields in a
 * view-faithful unified order (one list; the mode filters which render). Byte-identity is waived here
 * (bookmark §7-A precedent) — the old view/edit had divergent orders, so one list can't match both.
 */
const GROUP_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: [
          "image",
          "metadata",
          "name",
          "description",
          "primaryLanguage",
          "names",
          "groupType",
          "labeledWebsites",
          "connectedYoutubeChannels",
          "socialLinks",
          "creatorMedia",
          "genreMoods",
        ] satisfies GroupFieldKey[],
      }],
    },
    {
      key: "people",
      label: i18n.t("People"),
      sections: [{
        key: "people",
        fields: ["people"] satisfies GroupFieldKey[],
      }],
    },
    {
      key: "youtube-channels",
      label: i18n.t("YouTube Channels"),
      sections: [{
        key: "youtube-channels",
        fields: ["youtubeChannels"] satisfies GroupFieldKey[],
      }],
    },
    {
      key: "websites",
      label: i18n.t("Websites"),
      sections: [{
        key: "websites",
        fields: ["websites"] satisfies GroupFieldKey[],
      }],
    },
  ],
};

/** Single source of truth for a group's tabbed view/edit UI (main pane routes + right panel). */
export const groupWorkbench: EntityWorkbench<Group> = {
  useBySlug: (slug) => {
    const {
      group, isLoading,
    } = useGroupBySlug(slug);
    return {
      entity: group,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useGroups();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: group => group.name,
  useDelete: () => {
    const mutation = useDeleteGroup();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Group not found."),
  navAriaLabel: i18n.t("Group sections"),
  listingPath: "/taxonomies/groups",
  getSlug: group => group.slug,
  layoutKind: "group",
  fields: groupFields,
  defaultLayout: GROUP_DEFAULT_LAYOUT,
  // Layout-driven: the body comes from `fields` + `defaultLayout`. `tabs` is a thin placeholder
  // retained only for the descriptor's type requirement (no `group` nav metadata needed here).
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
    {
      key: "people",
      label: i18n.t("People"),
    },
    {
      key: "youtube-channels",
      label: i18n.t("YouTube Channels"),
    },
    {
      key: "websites",
      label: i18n.t("Websites"),
    },
  ],
};
