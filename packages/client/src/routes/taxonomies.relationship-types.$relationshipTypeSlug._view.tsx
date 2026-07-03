import { createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useRelationshipTypeBySlug } from "../hooks/useRelationshipTypes";

export const Route = createFileRoute("/taxonomies/relationship-types/$relationshipTypeSlug/_view")({
  component: RelationshipTypeViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/relationship-types/$relationshipTypeSlug/general",
    label: "General",
  },
] as const;

function RelationshipTypeViewLayout() {
  const {
    relationshipTypeSlug,
  } = Route.useParams();
  const {
    relationshipType, isLoading,
  } = useRelationshipTypeBySlug(relationshipTypeSlug);

  return (
    <TabbedEntityLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading
            ? "Relationship type"
            : (relationshipType?.name ?? "Relationship type not found")}
        </h1>
      )}
      nav={viewNav}
      params={{
        relationshipTypeSlug,
      }}
      navAriaLabel="Relationship type sections"
    />
  );
}
