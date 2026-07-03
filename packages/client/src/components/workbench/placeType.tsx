/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { LocationNode, PlaceType } from "@eesimple/types";

import { placeTypeKey } from "@eesimple/types";

import { LocationMapSection } from "../LocationMapSection";
import { PlaceTypeGeneralForm } from "../PlaceTypeGeneralForm";

import { useLocationTree } from "@/hooks/useLocations";
import { useDeletePlaceType, usePlaceTypeBySlug, usePlaceTypes } from "@/hooks/usePlaceTypes";
import { flattenTree } from "@/lib/tagTree";

function PlaceTypeGeneralView({
  entity: placeType,
}: {
  entity: PlaceType;
}) {
  const {
    data: tree = [],
  } = useLocationTree();
  // Plot every location of this place type. Flatten the tree and strip children so each match plots
  // as its own root — otherwise LocationMap would recurse into (differently-typed) descendants.
  const nodes: LocationNode[] = flattenTree(tree)
    .map(flat => flat.node)
    .filter(node => placeTypeKey(node.placeType) === placeType.slug)
    .map(node => ({
      ...node,
      children: [],
    }));

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(placeType.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{placeType.slug}</dd>
        <dt className="text-muted-foreground">Sort order</dt>
        <dd>{placeType.sortOrder}</dd>
        <dt className="text-muted-foreground">Locations</dt>
        <dd>{placeType.locationCount}</dd>
      </dl>
      {nodes.length > 0
        ? (
          <LocationMapSection
            mapKey={`place-type:${placeType.slug}`}
            tree={nodes}
            title="Map"
            scope={{
              kind: "location",
              currentPlaceType: placeType.slug,
            }}
          />
        )
        : (
          <p className="text-sm text-muted-foreground">
            No locations use this place type yet.
          </p>
        )}
    </div>
  );
}

/** Single source of truth for a place type's view/edit UI (main pane routes + right panel). */
export const placeTypeWorkbench: EntityWorkbench<PlaceType> = {
  useBySlug: (slug) => {
    const {
      placeType, isLoading,
    } = usePlaceTypeBySlug(slug);
    return {
      entity: placeType,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = usePlaceTypes();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: placeType => placeType.name,
  useDelete: () => {
    const mutation = useDeletePlaceType();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      // Simple delete (no reassignment); the reassign-on-delete dialog lives in the settings manager.
      run: (id, onDeleted) => mutation.mutate({
        id,
      }, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Place type not found.",
  navAriaLabel: "Place type sections",
  listingPath: "/taxonomies/place-types",
  getSlug: placeType => placeType.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Place type details and a map of its locations.",
        render: PlaceTypeGeneralView,
      },
      edit: {
        title: "General",
        description: "Name and sort order.",
        render: ({
          entity,
        }) => <PlaceTypeGeneralForm placeType={entity} />,
      },
    },
  ],
};
