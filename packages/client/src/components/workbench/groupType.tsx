/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { GroupType } from "@eesimple/types";

import { GroupTypeGeneralForm } from "../GroupTypeGeneralForm";

import {
  useDeleteGroupType,
  useGroupTypes,
  useGroupTypeBySlug,
} from "@/hooks/useGroupTypes";

function GroupTypeGeneralView({
  entity: groupType,
}: {
  entity: GroupType;
}) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(groupType.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{groupType.slug}</dd>
        <dt className="text-muted-foreground">Sort order</dt>
        <dd>{groupType.sortOrder}</dd>
        {groupType.groupCount != null
          ? (
            <>
              <dt className="text-muted-foreground">Groups</dt>
              <dd>{groupType.groupCount}</dd>
            </>
          )
          : null}
      </dl>
    </div>
  );
}

/** Single source of truth for a group type's view/edit UI (main pane routes + right panel). */
export const groupTypeWorkbench: EntityWorkbench<GroupType> = {
  useBySlug: (slug) => {
    const {
      groupType, isLoading,
    } = useGroupTypeBySlug(slug);
    return {
      entity: groupType,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useGroupTypes();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: groupType => groupType.name,
  useDelete: () => {
    const mutation = useDeleteGroupType();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Group type not found.",
  navAriaLabel: "Group type sections",
  getSlug: groupType => groupType.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Name, sort order, and metadata.",
        render: GroupTypeGeneralView,
      },
      edit: {
        title: "General",
        description: "Name and sort order.",
        render: ({
          entity,
        }) => <GroupTypeGeneralForm groupType={entity} />,
      },
    },
  ],
};
