import { createFileRoute } from "@tanstack/react-router";

import { RelationshipTypesListing } from "../components/RelationshipTypeManager";
import { useRelationshipTypes } from "../hooks/useRelationshipTypes";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/relationship-types/")({
  component: RelationshipTypesPage,
});

/** Manage the "Relationship Types" taxonomy used by bookmark relationships. */
function RelationshipTypesPage() {
  const {
    data: relationshipTypes,
  } = useRelationshipTypes();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Relationship Types</h1>
          {relationshipTypes
            ? (
              <Badge variant="secondary">
                {relationshipTypes.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Classify how bookmarks relate to one another. Apply these types when linking bookmarks in
          the Relationships editor.
        </p>
      </div>

      <RelationshipTypesListing />
    </section>
  );
}
