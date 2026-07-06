/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { Group } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import i18n from "../../i18n";
import { EntityImagePreview } from "../EntityImageField";
import { EntityNamesTabView } from "../entityNames/EntityNamesTab";
import { GroupGeneralForm } from "../GroupGeneralForm";
import { GroupPeopleForm, GroupPeopleView } from "../GroupPeopleForm";
import { GroupWebsitesForm, GroupWebsitesView } from "../GroupWebsitesForm";
import { GroupYouTubeChannelsForm, GroupYouTubeChannelsView } from "../GroupYouTubeChannelsForm";

import { useAlbums } from "@/hooks/useAlbums";
import { useDeleteGroup, useGroupBySlug, useGroups } from "@/hooks/useGroups";
import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { SOCIAL_MEDIA_PLATFORM_LABELS } from "@/lib/socialLinks";

function GroupGeneralView({
  entity: group,
}: {
  entity: Group;
}) {
  const {
    data: albums,
  } = useAlbums();
  const creditedAlbums = (albums ?? []).filter(album => group.albumIds.includes(album.id));
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
        <dt className="text-muted-foreground">{t("Names")}</dt>
        <dd>
          <EntityNamesTabView
            ownerType="group"
            ownerId={group.id}
          />
        </dd>
        <dt className="text-muted-foreground">{t("Group type")}</dt>
        <dd>{group.groupType?.name ?? <span className="text-muted-foreground">{t("None")}</span>}</dd>
        {group.website != null
          ? (
            <>
              <dt className="text-muted-foreground">{t("Website")}</dt>
              <dd>
                {group.website.siteName
                  ? `${group.website.siteName} (${group.website.domain})`
                  : group.website.domain}
              </dd>
            </>
          )
          : null}
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
        {creditedAlbums.length > 0
          ? (
            <>
              <dt className="text-muted-foreground">{t("Albums")}</dt>
              <dd className="flex flex-wrap gap-2">
                {creditedAlbums.map(album => (
                  <Link
                    key={album.id}
                    to="/taxonomies/albums/$albumSlug"
                    params={{
                      albumSlug: album.slug,
                    }}
                    className="
                      text-primary
                      hover:underline
                    "
                  >
                    {album.name}
                  </Link>
                ))}
              </dd>
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
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      view: {
        title: i18n.t("General"),
        description: i18n.t("Name, website, group type, image, Plex link, year, and album credits."),
        render: GroupGeneralView,
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Edit the group's name, website, group type, image, Plex link, year, and album credits."),
        render: ({
          entity,
        }) => <GroupGeneralForm group={entity} />,
      },
    },
    {
      key: "people",
      label: i18n.t("People"),
      view: {
        title: i18n.t("People"),
        description: i18n.t("People associated with this group."),
        render: ({
          entity,
        }) => <GroupPeopleView group={entity} />,
      },
      edit: {
        title: i18n.t("People"),
        description: i18n.t("Connect people to this group."),
        render: ({
          entity,
        }) => <GroupPeopleForm group={entity} />,
      },
    },
    {
      key: "youtube-channels",
      label: i18n.t("YouTube Channels"),
      view: {
        title: i18n.t("YouTube Channels"),
        description: i18n.t("YouTube channels associated with this group."),
        render: ({
          entity,
        }) => <GroupYouTubeChannelsView group={entity} />,
      },
      edit: {
        title: i18n.t("YouTube Channels"),
        description: i18n.t("Connect YouTube channels to this group."),
        render: ({
          entity,
        }) => <GroupYouTubeChannelsForm group={entity} />,
      },
    },
    {
      key: "websites",
      label: i18n.t("Websites"),
      view: {
        title: i18n.t("Websites"),
        description: i18n.t("Websites associated with this group."),
        render: ({
          entity,
        }) => <GroupWebsitesView group={entity} />,
      },
      edit: {
        title: i18n.t("Websites"),
        description: i18n.t("Connect websites to this group."),
        render: ({
          entity,
        }) => <GroupWebsitesForm group={entity} />,
      },
    },
  ],
};
