/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { LocationRelation } from "@eesimple/types";

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
  tabs: [
    {
      key: "bookmarks",
      label: i18n.t("Bookmarks"),
      view: {
        title: i18n.t("Bookmarks"),
        description: i18n.t("Bookmarks and the locations they relate to under this relation."),
        render: ({
          entity,
        }) => <LocationRelationCardsView locationRelation={entity} />,
      },
    },
    {
      key: "general",
      label: "General",
      view: {
        title: i18n.t("General"),
        description: i18n.t("Location relation details."),
        render: LocationRelationGeneralView,
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Name and sort order."),
        render: ({
          entity,
        }) => <LocationRelationGeneralForm locationRelation={entity} />,
      },
    },
  ],
};
