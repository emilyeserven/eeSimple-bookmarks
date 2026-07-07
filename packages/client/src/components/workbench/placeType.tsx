/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { LocationNode, PlaceType } from "@eesimple/types";

import { placeTypeKey } from "@eesimple/types";

import i18n from "../../i18n";
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
        <dt className="text-muted-foreground">{i18n.t("Added")}</dt>
        <dd>{new Date(placeType.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">{i18n.t("Slug")}</dt>
        <dd className="font-mono">{placeType.slug}</dd>
        <dt className="text-muted-foreground">{i18n.t("Sort order")}</dt>
        <dd>{placeType.sortOrder}</dd>
        <dt className="text-muted-foreground">{i18n.t("Locations")}</dt>
        <dd>{placeType.locationCount}</dd>
        {placeType.description && (
          <>
            <dt className="text-muted-foreground">{i18n.t("Description")}</dt>
            <dd>{placeType.description}</dd>
          </>
        )}
      </dl>
      {nodes.length > 0
        ? (
          <LocationMapSection
            mapKey={`place-type:${placeType.slug}`}
            tree={nodes}
            title={i18n.t("Map")}
            scope={{
              kind: "location",
              currentPlaceType: placeType.slug,
            }}
          />
        )
        : (
          <p className="text-sm text-muted-foreground">
            {i18n.t("No locations use this place type yet.")}
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
  notFound: i18n.t("Place type not found."),
  navAriaLabel: i18n.t("Place type sections"),
  listingPath: "/taxonomies/place-types",
  getSlug: placeType => placeType.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: i18n.t("General"),
        description: i18n.t("Place type details and a map of its locations."),
        render: PlaceTypeGeneralView,
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Name and sort order."),
        render: ({
          entity,
        }) => <PlaceTypeGeneralForm placeType={entity} />,
      },
    },
  ],
};
