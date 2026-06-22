import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteRelationshipType, useRelationshipTypeBySlug } from "../hooks/useRelationshipTypes";

import { Button } from "@/components/ui/button";

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
  const navigate = Route.useNavigate();
  const {
    relationshipType, isLoading,
  } = useRelationshipTypeBySlug(relationshipTypeSlug);
  const deleteRelationshipType = useDeleteRelationshipType();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/relationship-types"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to relationship types
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading
                ? "Relationship type"
                : (relationshipType?.name ?? "Relationship type not found")}
            </h1>
            {relationshipType
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to="/taxonomies/relationship-types/$relationshipTypeSlug/edit/general"
                      params={{
                        relationshipTypeSlug,
                      }}
                    >
                      Edit
                    </Link>
                  </Button>
                  {relationshipType.builtIn
                    ? null
                    : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="
                          text-destructive
                          hover:text-destructive
                        "
                        disabled={deleteRelationshipType.isPending}
                        onClick={() => deleteRelationshipType.mutate(relationshipType.id, {
                          onSuccess: () => navigate({
                            to: "/taxonomies/relationship-types",
                          }),
                        })}
                      >
                        {deleteRelationshipType.isPending ? "Deleting…" : "Delete"}
                      </Button>
                    )}
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        relationshipTypeSlug,
      }}
      navAriaLabel="Relationship type sections"
    />
  );
}
