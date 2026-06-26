import type { EntityWorkbench } from "./types";
import type { RelationshipType } from "@eesimple/types";

import { RelationshipTypeDetail } from "../RelationshipTypeDetail";
import { RelationshipTypeGeneralForm } from "../RelationshipTypeGeneralForm";

import { useDeleteRelationshipType, useRelationshipTypeBySlug, useRelationshipTypes } from "@/hooks/useRelationshipTypes";

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
  notFound: "Relationship type not found.",
  navAriaLabel: "Relationship type sections",
  getSlug: rt => rt.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Direction, usage counts, and metadata.",
        render: ({
          entity,
        }) => <RelationshipTypeDetail relationshipType={entity} />,
      },
      edit: {
        title: "General",
        description: "Name and direction.",
        render: ({
          entity,
        }) => <RelationshipTypeGeneralForm relationshipType={entity} />,
      },
    },
  ],
};
