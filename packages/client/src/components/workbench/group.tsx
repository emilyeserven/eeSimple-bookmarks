/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { Group } from "@eesimple/types";

import { GroupGeneralForm } from "../GroupGeneralForm";
import { GroupPeopleForm, GroupPeopleView } from "../GroupPeopleForm";

import { useDeleteGroup, useGroupBySlug, useGroups } from "@/hooks/useGroups";
import { SOCIAL_MEDIA_PLATFORM_LABELS } from "@/lib/socialLinks";

function GroupGeneralView({
  entity: group,
}: {
  entity: Group;
}) {
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Added</dt>
      <dd>{new Date(group.createdAt).toLocaleDateString()}</dd>
      <dt className="text-muted-foreground">Slug</dt>
      <dd className="font-mono">{group.slug}</dd>
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
  getSlug: group => group.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Name and associated website.",
        render: GroupGeneralView,
      },
      edit: {
        title: "General",
        description: "Edit the group's name and website association.",
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
  ],
};
