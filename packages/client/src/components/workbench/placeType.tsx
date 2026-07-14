/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, LocationNode, PlaceType } from "@eesimple/types";

import { placeTypeKey } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import i18n from "../../i18n";
import { LocationMapSection } from "../LocationMapSection";
import {
  PlaceTypeDescriptionEditField,
  PlaceTypeNameEditField,
  PlaceTypeSortOrderEditField,
} from "../PlaceTypeGeneralForm";

import { DetailField } from "@/components/DetailField";
import { useLocationTree } from "@/hooks/useLocations";
import { useDeletePlaceType, usePlaceTypeBySlug, usePlaceTypes } from "@/hooks/usePlaceTypes";
import { flattenTree } from "@/lib/tagTree";

interface PlaceTypeViewProps {
  placeType: PlaceType;
}

/** "Added" (created date) row. */
function PlaceTypeAddedView({
  placeType,
}: PlaceTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Added")}>{new Date(placeType.createdAt).toLocaleDateString()}</DetailField>;
}

/** "Slug" row (monospace). */
function PlaceTypeSlugView({
  placeType,
}: PlaceTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Slug")}>
      <span className="font-mono">{placeType.slug}</span>
    </DetailField>
  );
}

/** "Sort order" row. */
function PlaceTypeSortOrderView({
  placeType,
}: PlaceTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Sort order")}>{placeType.sortOrder}</DetailField>;
}

/** "Locations" (count) row. */
function PlaceTypeLocationsView({
  placeType,
}: PlaceTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Locations")}>{placeType.locationCount}</DetailField>;
}

/** "Description" row — self-hiding when empty. */
function PlaceTypeDescriptionView({
  placeType,
}: PlaceTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Description")}>{placeType.description || null}</DetailField>;
}

/**
 * The map of every location using this place type. Its own placeable field (calls `useLocationTree`, so
 * it must be a real component the render seam mounts, not an inline hook call).
 */
function PlaceTypeMapView({
  placeType,
}: PlaceTypeViewProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: tree = [],
  } = useLocationTree();
  // Plot every location of this place type. Flatten the tree and strip children so each match plots as
  // its own root — otherwise LocationMap would recurse into (differently-typed) descendants.
  const nodes: LocationNode[] = flattenTree(tree)
    .map(flat => flat.node)
    .filter(node => placeTypeKey(node.placeType) === placeType.slug)
    .map(node => ({
      ...node,
      children: [],
    }));

  if (nodes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("No locations use this place type yet.")}
      </p>
    );
  }
  return (
    <LocationMapSection
      mapKey={`place-type:${placeType.slug}`}
      tree={nodes}
      title={t("Map")}
      scope={{
        kind: "location",
        currentPlaceType: placeType.slug,
      }}
    />
  );
}

/**
 * The place type workbench's field registry (#1106 layout editor). The old single `general` composite is
 * fully atomized (#1371, following the media-type #1189 reference) into per-field, mode-aware
 * {@link WorkbenchField}s so an operator can place each independently in **Settings → Page Layouts**. Each
 * edit field owns its own single-field `useAppForm` + `useFieldAutoSave` — no form-context provider
 * needed (the Category precedent). `name` is **edit-only**; `added`/`slug`/`locations`/`map` are
 * **view-only**; `sortOrder`/`description` carry both. Authored as an exhaustive
 * `Record<PlaceTypeFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type PlaceTypeFieldKey
  = | "added"
    | "slug"
    | "name"
    | "sortOrder"
    | "locations"
    | "description"
    | "map";

const placeTypeFields = {
  added: {
    key: "added",
    label: i18n.t("Added"),
    view: ({
      entity,
    }) => <PlaceTypeAddedView placeType={entity} />,
  },
  slug: {
    key: "slug",
    label: i18n.t("Slug"),
    view: ({
      entity,
    }) => <PlaceTypeSlugView placeType={entity} />,
  },
  name: {
    key: "name",
    label: i18n.t("Name"),
    edit: ({
      entity,
    }) => <PlaceTypeNameEditField placeType={entity} />,
  },
  sortOrder: {
    key: "sortOrder",
    label: i18n.t("Sort order"),
    view: ({
      entity,
    }) => <PlaceTypeSortOrderView placeType={entity} />,
    edit: ({
      entity,
    }) => <PlaceTypeSortOrderEditField placeType={entity} />,
  },
  locations: {
    key: "locations",
    label: i18n.t("Locations"),
    view: ({
      entity,
    }) => <PlaceTypeLocationsView placeType={entity} />,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    view: ({
      entity,
    }) => <PlaceTypeDescriptionView placeType={entity} />,
    edit: ({
      entity,
    }) => <PlaceTypeDescriptionEditField placeType={entity} />,
  },
  map: {
    key: "map",
    label: i18n.t("Map"),
    view: ({
      entity,
    }) => <PlaceTypeMapView placeType={entity} />,
  },
} satisfies Record<PlaceTypeFieldKey, WorkbenchField<PlaceType>>;

/**
 * The code default layout: one General tab, one untitled section listing every atomized field in one
 * per-mode-sensible order — the view-visible subset reproduces the pre-#1371 `<dl>` + map order, and the
 * edit-visible subset (`name`/`sortOrder`/`description`) reproduces the pre-#1371 form order.
 */
const PLACE_TYPE_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["added", "slug", "name", "sortOrder", "locations", "description", "map"] satisfies PlaceTypeFieldKey[],
      }],
    },
  ],
};

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
  layoutKind: "place-type",
  fields: placeTypeFields,
  defaultLayout: PLACE_TYPE_DEFAULT_LAYOUT,
  // Layout-driven: the body comes from `fields` + `defaultLayout`. A single tab needs no `group`, so
  // `tabs` is a thin placeholder retained only for the descriptor's type requirement.
  tabs: [
    {
      key: "general",
      label: "General",
    },
  ],
};
