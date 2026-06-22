import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useRelationshipTypeBySlug } from "../hooks/useRelationshipTypes";

export const Route = createFileRoute("/taxonomies/relationship-types/$relationshipTypeSlug/edit")({
  component: RelationshipTypeEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/relationship-types/$relationshipTypeSlug/edit/general",
    label: "General",
  },
] as const;

function RelationshipTypeEditLayout() {
  const {
    relationshipTypeSlug,
  } = Route.useParams();
  const {
    relationshipType, isLoading,
  } = useRelationshipTypeBySlug(relationshipTypeSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/relationship-types/$relationshipTypeSlug"
            params={{
              relationshipTypeSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to {isLoading
              ? "relationship type"
              : (relationshipType?.name ?? "relationship type")}
          </Link>
          <h1 className="text-2xl font-bold">Edit relationship type</h1>
        </div>
      )}
      nav={editNav}
      params={{
        relationshipTypeSlug,
      }}
      navAriaLabel="Relationship type edit sections"
    />
  );
}
