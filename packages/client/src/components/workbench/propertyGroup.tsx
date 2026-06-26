/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { PropertyGroup } from "@eesimple/types";

import { PropertyGroupGeneralForm } from "../PropertyGroupGeneralForm";

import { useDeletePropertyGroup, usePropertyGroupBySlug, usePropertyGroups } from "@/hooks/usePropertyGroups";

function PropertyGroupGeneralView({
  entity: group,
}: {
  entity: PropertyGroup;
}) {
  return (
    <div className="space-y-4">
      {group.description
        ? <p className="text-sm text-muted-foreground">{group.description}</p>
        : null}
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(group.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{group.slug}</dd>
        <dt className="text-muted-foreground">Priority</dt>
        <dd>{group.priority}</dd>
        {group.propertyCount != null
          ? (
            <>
              <dt className="text-muted-foreground">Properties</dt>
              <dd>{group.propertyCount}</dd>
            </>
          )
          : null}
      </dl>
    </div>
  );
}

/** Single source of truth for a property group's view/edit UI (main pane routes + right panel). */
export const propertyGroupWorkbench: EntityWorkbench<PropertyGroup> = {
  useBySlug: (slug) => {
    const {
      propertyGroup, isLoading,
    } = usePropertyGroupBySlug(slug);
    return {
      entity: propertyGroup,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = usePropertyGroups();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: group => group.name,
  useDelete: () => {
    const mutation = useDeletePropertyGroup();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Property group not found.",
  navAriaLabel: "Property group sections",
  getSlug: group => group.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Name, priority, description, and metadata.",
        render: PropertyGroupGeneralView,
      },
      edit: {
        title: "General",
        description: "Name, priority, and description.",
        render: ({
          entity,
        }) => <PropertyGroupGeneralForm group={entity} />,
      },
    },
  ],
};
