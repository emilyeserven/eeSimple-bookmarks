import { createTabWrapper } from "./TabWrapper";

import { useRelationshipTypeBySlug } from "@/hooks/useRelationshipTypes";

/** Loads a relationship type by slug and renders a tab's title + description header above its content. */
export const RelationshipTypeTabWrapper = createTabWrapper(
  "relationshipTypeSlug",
  useRelationshipTypeBySlug,
  result => result.relationshipType,
  "Relationship type not found.",
);
