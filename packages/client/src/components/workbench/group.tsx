/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { Group } from "@eesimple/types";

import { Building2 } from "lucide-react";

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

  return (
    <div className="space-y-3">
      <EntityImagePreview
        imageUrl={group.imageUrl}
        fallback={<Building2 className="size-6" />}
      />
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(group.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{group.slug}</dd>
        <dt className="text-muted-foreground">Names</dt>
        <dd>
          <EntityNamesTabView
            ownerType="group"
            ownerId={group.id}
          />
        </dd>
        <dt className="text-muted-foreground">Group type</dt>
        <dd>{group.groupType?.name ?? <span className="text-muted-foreground">None</span>}</dd>
        {group.website != null
          ? (
            <>
              <dt className="text-muted-foreground">Website</dt>
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
              <dt className="text-muted-foreground">Bookmarks</dt>
              <dd>{group.bookmarkCount}</dd>
            </>
          )
          : null}
        {group.year != null
          ? (
            <>
              <dt className="text-muted-foreground">Year</dt>
              <dd>{group.year}</dd>
            </>
          )
          : null}
        {group.plexItemTitle != null
          ? (
            <>
              <dt className="text-muted-foreground">Plex</dt>
              <dd>{group.plexItemTitle}</dd>
            </>
          )
          : null}
        {creditedAlbums.length > 0
          ? (
            <>
              <dt className="text-muted-foreground">Albums</dt>
              <dd>{creditedAlbums.map(album => album.name).join(", ")}</dd>
            </>
          )
          : null}
        {connectedChannels.length > 0
          ? (
            <>
              <dt className="text-muted-foreground">YouTube channels</dt>
              <dd>{connectedChannels.map(ch => ch.name).join(", ")}</dd>
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
  notFound: "Group not found.",
  navAriaLabel: "Group sections",
  listingPath: "/taxonomies/groups",
  getSlug: group => group.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Name, website, group type, image, Plex link, year, and album credits.",
        render: GroupGeneralView,
      },
      edit: {
        title: "General",
        description: "Edit the group's name, website, group type, image, Plex link, year, and album credits.",
        render: ({
          entity,
        }) => <GroupGeneralForm group={entity} />,
      },
    },
    {
      key: "people",
      label: "People",
      view: {
        title: "People",
        description: "People associated with this group.",
        render: ({
          entity,
        }) => <GroupPeopleView group={entity} />,
      },
      edit: {
        title: "People",
        description: "Connect people to this group.",
        render: ({
          entity,
        }) => <GroupPeopleForm group={entity} />,
      },
    },
    {
      key: "youtube-channels",
      label: "YouTube Channels",
      view: {
        title: "YouTube Channels",
        description: "YouTube channels associated with this group.",
        render: ({
          entity,
        }) => <GroupYouTubeChannelsView group={entity} />,
      },
      edit: {
        title: "YouTube Channels",
        description: "Connect YouTube channels to this group.",
        render: ({
          entity,
        }) => <GroupYouTubeChannelsForm group={entity} />,
      },
    },
    {
      key: "websites",
      label: "Websites",
      view: {
        title: "Websites",
        description: "Websites associated with this group.",
        render: ({
          entity,
        }) => <GroupWebsitesView group={entity} />,
      },
      edit: {
        title: "Websites",
        description: "Connect websites to this group.",
        render: ({
          entity,
        }) => <GroupWebsitesForm group={entity} />,
      },
    },
  ],
};
