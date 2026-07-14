/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, LocationRelation } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import i18n from "../../i18n";
import { LocationRelationCardsView } from "../LocationRelationCardsView";
import {
  LocationRelationDescriptionEditField,
  LocationRelationNameEditField,
  LocationRelationSortOrderEditField,
} from "../LocationRelationGeneralForm";

import { DetailField } from "@/components/DetailField";
import {
  useDeleteLocationRelation,
  useLocationRelationBySlug,
  useLocationRelations,
} from "@/hooks/useLocationRelations";

interface LocationRelationViewProps {
  locationRelation: LocationRelation;
}

/** "Added" (created date) row. */
function LocationRelationAddedView({
  locationRelation,
}: LocationRelationViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Added")}>{new Date(locationRelation.createdAt).toLocaleDateString()}</DetailField>;
}

/** "Slug" row (monospace). */
function LocationRelationSlugView({
  locationRelation,
}: LocationRelationViewProps) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Slug")}>
      <span className="font-mono">{locationRelation.slug}</span>
    </DetailField>
  );
}

/** "Sort order" row. */
function LocationRelationSortOrderView({
  locationRelation,
}: LocationRelationViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Sort order")}>{locationRelation.sortOrder}</DetailField>;
}

/** "Bookmarks" (count) row. */
function LocationRelationBookmarkCountView({
  locationRelation,
}: LocationRelationViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Bookmarks")}>{locationRelation.bookmarkCount}</DetailField>;
}

/** "Built-in" row — self-hiding for a non-built-in relation. */
function LocationRelationBuiltInView({
  locationRelation,
}: LocationRelationViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Built-in")}>{locationRelation.builtIn ? t("Yes") : null}</DetailField>;
}

/** "Description" row — self-hiding when empty. */
function LocationRelationDescriptionView({
  locationRelation,
}: LocationRelationViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Description")}>{locationRelation.description || null}</DetailField>;
}

/**
 * The location relation workbench's field registry (#1106 layout editor). The old single `general`
 * composite is fully atomized (#1371, following the media-type #1189 reference) into per-field,
 * mode-aware {@link WorkbenchField}s. `bookmarks` (the cards list) stays a **view-only** field, keeping
 * the old view-only "Bookmarks" tab; `name` is **edit-only**; `added`/`slug`/`bookmarkCount`/`builtIn`
 * are **view-only**; `sortOrder`/`description` carry both. Authored as an exhaustive
 * `Record<LocationRelationFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type LocationRelationFieldKey
  = | "bookmarks"
    | "added"
    | "slug"
    | "name"
    | "sortOrder"
    | "bookmarkCount"
    | "builtIn"
    | "description";

const locationRelationFields = {
  bookmarks: {
    key: "bookmarks",
    label: i18n.t("Bookmarks"),
    view: ({
      entity,
    }) => <LocationRelationCardsView locationRelation={entity} />,
  },
  added: {
    key: "added",
    label: i18n.t("Added"),
    view: ({
      entity,
    }) => <LocationRelationAddedView locationRelation={entity} />,
  },
  slug: {
    key: "slug",
    label: i18n.t("Slug"),
    view: ({
      entity,
    }) => <LocationRelationSlugView locationRelation={entity} />,
  },
  name: {
    key: "name",
    label: i18n.t("Name"),
    edit: ({
      entity,
    }) => <LocationRelationNameEditField locationRelation={entity} />,
  },
  sortOrder: {
    key: "sortOrder",
    label: i18n.t("Sort order"),
    view: ({
      entity,
    }) => <LocationRelationSortOrderView locationRelation={entity} />,
    edit: ({
      entity,
    }) => <LocationRelationSortOrderEditField locationRelation={entity} />,
  },
  bookmarkCount: {
    key: "bookmarkCount",
    label: i18n.t("Bookmarks"),
    view: ({
      entity,
    }) => <LocationRelationBookmarkCountView locationRelation={entity} />,
  },
  builtIn: {
    key: "builtIn",
    label: i18n.t("Built-in"),
    view: ({
      entity,
    }) => <LocationRelationBuiltInView locationRelation={entity} />,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    view: ({
      entity,
    }) => <LocationRelationDescriptionView locationRelation={entity} />,
    edit: ({
      entity,
    }) => <LocationRelationDescriptionEditField locationRelation={entity} />,
  },
} satisfies Record<LocationRelationFieldKey, WorkbenchField<LocationRelation>>;

/**
 * The code default layout: the view-only Bookmarks tab, then the General tab whose single section lists
 * every atomized field in one per-mode-sensible order — the view-visible subset reproduces the pre-#1371
 * `<dl>` order (Added, Slug, Sort order, Bookmarks, Built-in, Description), and the edit-visible subset
 * (`name`/`sortOrder`/`description`) reproduces the pre-#1371 form order.
 */
const LOCATION_RELATION_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "bookmarks",
      label: i18n.t("Bookmarks"),
      sections: [{
        key: "bookmarks",
        fields: ["bookmarks"] satisfies LocationRelationFieldKey[],
      }],
    },
    {
      key: "general",
      label: "General",
      sections: [{
        key: "general",
        fields: ["added", "slug", "name", "sortOrder", "bookmarkCount", "builtIn", "description"] satisfies LocationRelationFieldKey[],
      }],
    },
  ],
};

/** Single source of truth for a location relation's view/edit UI (main pane routes + right panel). */
export const locationRelationWorkbench: EntityWorkbench<LocationRelation> = {
  useBySlug: (slug) => {
    const {
      locationRelation, isLoading,
    } = useLocationRelationBySlug(slug);
    return {
      entity: locationRelation,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useLocationRelations();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: relation => relation.name,
  isBuiltIn: relation => relation.builtIn,
  canDelete: relation => !relation.builtIn,
  useDelete: () => {
    const mutation = useDeleteLocationRelation();
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
  notFound: i18n.t("Location relation not found."),
  navAriaLabel: i18n.t("Location relation sections"),
  listingPath: "/taxonomies/location-relations",
  getSlug: relation => relation.slug,
  layoutKind: "location-relation",
  fields: locationRelationFields,
  defaultLayout: LOCATION_RELATION_DEFAULT_LAYOUT,
  // Layout-driven: the body comes from `fields` + `defaultLayout`. `tabs` is a thin placeholder
  // retained only for the descriptor's type requirement (no `group` nav metadata needed here).
  tabs: [
    {
      key: "bookmarks",
      label: i18n.t("Bookmarks"),
    },
    {
      key: "general",
      label: "General",
    },
  ],
};
