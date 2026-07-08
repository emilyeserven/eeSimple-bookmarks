/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, LocationRelation } from "@eesimple/types";

import i18n from "../../i18n";
import { LocationRelationCardsView } from "../LocationRelationCardsView";
import { LocationRelationGeneralForm } from "../LocationRelationGeneralForm";

import {
  useDeleteLocationRelation,
  useLocationRelationBySlug,
  useLocationRelations,
} from "@/hooks/useLocationRelations";

function LocationRelationGeneralView({
  entity: relation,
}: {
  entity: LocationRelation;
}) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{i18n.t("Added")}</dt>
        <dd>{new Date(relation.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">{i18n.t("Slug")}</dt>
        <dd className="font-mono">{relation.slug}</dd>
        <dt className="text-muted-foreground">{i18n.t("Sort order")}</dt>
        <dd>{relation.sortOrder}</dd>
        <dt className="text-muted-foreground">{i18n.t("Bookmarks")}</dt>
        <dd>{relation.bookmarkCount}</dd>
        {relation.builtIn
          ? (
            <>
              <dt className="text-muted-foreground">{i18n.t("Built-in")}</dt>
              <dd>{i18n.t("Yes")}</dd>
            </>
          )
          : null}
        {relation.description && (
          <>
            <dt className="text-muted-foreground">{i18n.t("Description")}</dt>
            <dd>{relation.description}</dd>
          </>
        )}
      </dl>
    </div>
  );
}

/**
 * The location relation workbench's field registry (#1106 layout editor). `bookmarks` is **view-only**
 * (`LocationRelationCardsView`); `general` carries both modes — reproducing the old view-only
 * "Bookmarks" tab with no special-casing.
 */
type LocationRelationFieldKey = "bookmarks" | "general";

const locationRelationFields = {
  bookmarks: {
    key: "bookmarks",
    label: i18n.t("Bookmarks"),
    view: ({
      entity,
    }) => <LocationRelationCardsView locationRelation={entity} />,
  },
  general: {
    key: "general",
    label: i18n.t("General"),
    view: LocationRelationGeneralView,
    edit: ({
      entity,
    }) => <LocationRelationGeneralForm locationRelation={entity} />,
  },
} satisfies Record<LocationRelationFieldKey, WorkbenchField<LocationRelation>>;

/** The code default layout: the current two tabs, one untitled section each, in current order. */
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
        fields: ["general"] satisfies LocationRelationFieldKey[],
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
