import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, RelationshipType } from "@eesimple/types";

import i18n from "../../i18n";
import { RelationshipTypeCardsView } from "../RelationshipTypeCardsView";
import { RelationshipTypeDetail } from "../RelationshipTypeDetail";
import { RelationshipTypeGeneralForm } from "../RelationshipTypeGeneralForm";

import { useDeleteRelationshipType, useRelationshipTypeBySlug, useRelationshipTypes } from "@/hooks/useRelationshipTypes";

/**
 * The relationship type workbench's field registry (#1106 layout editor). `relationships` is
 * **view-only** (`RelationshipTypeCardsView`); `general` carries both modes — reproducing the old
 * view-only "Relationships" tab with no special-casing.
 */
type RelationshipTypeFieldKey = "relationships" | "general";

const relationshipTypeFields = {
  relationships: {
    key: "relationships",
    label: i18n.t("Relationships"),
    view: ({
      entity,
    }) => <RelationshipTypeCardsView relationshipType={entity} />,
  },
  general: {
    key: "general",
    label: i18n.t("General"),
    view: ({
      entity,
    }) => <RelationshipTypeDetail relationshipType={entity} />,
    edit: ({
      entity,
    }) => <RelationshipTypeGeneralForm relationshipType={entity} />,
  },
} satisfies Record<RelationshipTypeFieldKey, WorkbenchField<RelationshipType>>;

/** The code default layout: the current two tabs, one untitled section each, in current order. */
const RELATIONSHIP_TYPE_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "relationships",
      label: i18n.t("Relationships"),
      sections: [{
        key: "relationships",
        fields: ["relationships"] satisfies RelationshipTypeFieldKey[],
      }],
    },
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["general"] satisfies RelationshipTypeFieldKey[],
      }],
    },
  ],
};

/** Single source of truth for a relationship type's view/edit UI (main pane routes + right panel). */
export const relationshipTypeWorkbench: EntityWorkbench<RelationshipType> = {
  useBySlug: (slug) => {
    const {
      relationshipType, isLoading,
    } = useRelationshipTypeBySlug(slug);
    return {
      entity: relationshipType,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useRelationshipTypes();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: relationshipType => relationshipType.name,
  isBuiltIn: relationshipType => relationshipType.builtIn,
  canDelete: relationshipType => !relationshipType.builtIn,
  useDelete: () => {
    const mutation = useDeleteRelationshipType();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Relationship type not found"),
  navAriaLabel: i18n.t("Relationship type sections"),
  listingPath: "/taxonomies/relationship-types",
  getSlug: rt => rt.slug,
  layoutKind: "relationship-type",
  fields: relationshipTypeFields,
  defaultLayout: RELATIONSHIP_TYPE_DEFAULT_LAYOUT,
  // Layout-driven: the body comes from `fields` + `defaultLayout`. `tabs` is a thin placeholder
  // retained only for the descriptor's type requirement (no `group` nav metadata needed here).
  tabs: [
    {
      key: "relationships",
      label: i18n.t("Relationships"),
    },
    {
      key: "general",
      label: i18n.t("General"),
    },
  ],
};
