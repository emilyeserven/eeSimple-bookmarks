import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, RelationshipType } from "@eesimple/types";

import i18n from "../../i18n";
import { RelationshipTypeCardsView } from "../RelationshipTypeCardsView";
import {
  RelationshipTypeAddedView,
  RelationshipTypeBookmarkCountView,
  RelationshipTypeBuiltInView,
  RelationshipTypeDescriptionView,
  RelationshipTypeDirectionView,
  RelationshipTypeRelationshipCountView,
  RelationshipTypeSlugView,
} from "../RelationshipTypeDetail";
import {
  RelationshipTypeDescriptionEditField,
  RelationshipTypeDirectionalEditField,
  RelationshipTypeNameEditField,
} from "../RelationshipTypeGeneralForm";

import { useDeleteRelationshipType, useRelationshipTypeBySlug, useRelationshipTypes } from "@/hooks/useRelationshipTypes";

/**
 * The relationship type workbench's field registry (#1106 layout editor). The old single `general`
 * composite is fully atomized (#1371, following the media-type #1189 reference) into per-field,
 * mode-aware {@link WorkbenchField}s. `relationships` (the cards list) stays a **view-only** field,
 * keeping the old view-only "Relationships" tab; `name` is **edit-only**;
 * `slug`/`bookmarkCount`/`relationshipCount`/`builtIn`/`added` are **view-only**;
 * `description`/`directional` carry both. Authored as an exhaustive `Record<RelationshipTypeFieldKey, …>`
 * so a key without a renderer fails `tsc`.
 */
type RelationshipTypeFieldKey
  = | "relationships"
    | "name"
    | "slug"
    | "description"
    | "directional"
    | "bookmarkCount"
    | "relationshipCount"
    | "builtIn"
    | "added";

const relationshipTypeFields = {
  relationships: {
    key: "relationships",
    label: i18n.t("Relationships"),
    view: ({
      entity,
    }) => <RelationshipTypeCardsView relationshipType={entity} />,
  },
  name: {
    key: "name",
    label: i18n.t("Name"),
    edit: ({
      entity,
    }) => <RelationshipTypeNameEditField relationshipType={entity} />,
  },
  slug: {
    key: "slug",
    label: i18n.t("Slug"),
    view: ({
      entity,
    }) => <RelationshipTypeSlugView relationshipType={entity} />,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    view: ({
      entity,
    }) => <RelationshipTypeDescriptionView relationshipType={entity} />,
    edit: ({
      entity,
    }) => <RelationshipTypeDescriptionEditField relationshipType={entity} />,
  },
  directional: {
    key: "directional",
    label: i18n.t("Direction"),
    view: ({
      entity,
    }) => <RelationshipTypeDirectionView relationshipType={entity} />,
    edit: ({
      entity,
    }) => <RelationshipTypeDirectionalEditField relationshipType={entity} />,
  },
  bookmarkCount: {
    key: "bookmarkCount",
    label: i18n.t("Bookmarks"),
    view: ({
      entity,
    }) => <RelationshipTypeBookmarkCountView relationshipType={entity} />,
  },
  relationshipCount: {
    key: "relationshipCount",
    label: i18n.t("Relationships"),
    view: ({
      entity,
    }) => <RelationshipTypeRelationshipCountView relationshipType={entity} />,
  },
  builtIn: {
    key: "builtIn",
    label: i18n.t("Built-in"),
    view: ({
      entity,
    }) => <RelationshipTypeBuiltInView relationshipType={entity} />,
  },
  added: {
    key: "added",
    label: i18n.t("Added"),
    view: ({
      entity,
    }) => <RelationshipTypeAddedView relationshipType={entity} />,
  },
} satisfies Record<RelationshipTypeFieldKey, WorkbenchField<RelationshipType>>;

/**
 * The code default layout: the view-only Relationships tab, then the General tab whose single section
 * lists every atomized field in one per-mode-sensible order — the edit-visible subset
 * (`name`/`description`/`directional`) reproduces the pre-#1371 form order, and the view-visible subset
 * reproduces the pre-#1371 `RelationshipTypeDetail` order (Slug, Description, Direction, Bookmarks,
 * Relationships, Built-in, Added).
 */
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
        fields: [
          "name",
          "slug",
          "description",
          "directional",
          "bookmarkCount",
          "relationshipCount",
          "builtIn",
          "added",
        ] satisfies RelationshipTypeFieldKey[],
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
