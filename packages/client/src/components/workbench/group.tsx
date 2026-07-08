/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, Group } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import i18n from "../../i18n";
import { EntityImagePreview } from "../EntityImageField";
import { EntityNamesTabView, PrimaryLanguageDlRow } from "../entityNames/EntityNamesTab";
import { GroupGeneralForm } from "../GroupGeneralForm";
import { GroupPeopleForm, GroupPeopleView } from "../GroupPeopleForm";
import { GroupWebsitesForm, GroupWebsitesView } from "../GroupWebsitesForm";
import { GroupYouTubeChannelsForm, GroupYouTubeChannelsView } from "../GroupYouTubeChannelsForm";

import { useDeleteGroup, useGroupBySlug, useGroups } from "@/hooks/useGroups";
import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { SOCIAL_MEDIA_PLATFORM_LABELS } from "@/lib/socialLinks";

function GroupGeneralView({
  entity: group,
}: {
  entity: Group;
}) {
  const {
    data: youtubeChannels,
  } = useYouTubeChannels();
  const connectedChannels = (youtubeChannels ?? []).filter(ch => group.youtubeChannelIds.includes(ch.id));
  const {
    t,
  } = useTranslation();

  return (
    <div className="space-y-3">
      <EntityImagePreview
        imageUrl={group.imageUrl}
        fallback={<Building2 className="size-6" />}
      />
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t("Added")}</dt>
        <dd>{new Date(group.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">{t("Slug")}</dt>
        <dd className="font-mono">{group.slug}</dd>
        {group.description
          ? (
            <>
              <dt className="text-muted-foreground">{t("Description")}</dt>
              <dd>{group.description}</dd>
            </>
          )
          : null}
        <PrimaryLanguageDlRow
          ownerType="group"
          ownerId={group.id}
        />
        <dt className="text-muted-foreground">{t("Names")}</dt>
        <dd>
          <EntityNamesTabView
            ownerType="group"
            ownerId={group.id}
          />
        </dd>
        <dt className="text-muted-foreground">{t("Group type")}</dt>
        <dd>{group.groupType?.name ?? <span className="text-muted-foreground">{t("None")}</span>}</dd>
        {group.labeledWebsites.map((site, index) => (
          <>
            <dt

              key={`lw-label-${index}`}
              className="text-muted-foreground"
            >
              {site.label.trim().length > 0 ? site.label : t("Website")}
            </dt>
            <dd

              key={`lw-value-${index}`}
            >
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {site.url}
              </a>
            </dd>
          </>
        ))}
        {group.bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">{t("Bookmarks")}</dt>
              <dd>{group.bookmarkCount}</dd>
            </>
          )
          : null}
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
        {connectedChannels.length > 0
          ? (
            <>
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
            </>
          )
          : null}
        {group.socialLinks.map(link => (
          <>
            <dt
              key={`${link.platform}-label`}
              className="text-muted-foreground"
            >
              {SOCIAL_MEDIA_PLATFORM_LABELS[link.platform]}
            </dt>
            <dd key={`${link.platform}-value`}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {link.url}
              </a>
            </dd>
          </>
        ))}
      </dl>
    </div>
  );
}

/**
 * The group workbench's field registry (#1106 layout editor). All four fields carry both modes — the
 * entity has no view-only/edit-only tabs today.
 */
type GroupFieldKey = "general" | "people" | "youtubeChannels" | "websites";

const groupFields = {
  general: {
    key: "general",
    label: i18n.t("General"),
    view: GroupGeneralView,
    edit: ({
      entity,
    }) => <GroupGeneralForm group={entity} />,
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

/** The code default layout: the current four tabs, one untitled section each, in current order. */
const GROUP_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["general"] satisfies GroupFieldKey[],
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
