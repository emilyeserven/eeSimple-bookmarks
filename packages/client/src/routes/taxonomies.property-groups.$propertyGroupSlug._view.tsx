import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeletePropertyGroup, usePropertyGroupBySlug } from "../hooks/usePropertyGroups";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/property-groups/$propertyGroupSlug/_view")({
  component: PropertyGroupViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/property-groups/$propertyGroupSlug/general",
    label: "General",
  },
] as const;

function PropertyGroupViewLayout() {
  const {
    propertyGroupSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    propertyGroup, isLoading,
  } = usePropertyGroupBySlug(propertyGroupSlug);
  const deleteGroup = useDeletePropertyGroup();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/property-groups"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to property groups
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading ? "Property group" : (propertyGroup?.name ?? "Property group not found")}
            </h1>
            {propertyGroup
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to="/taxonomies/property-groups/$propertyGroupSlug/edit/general"
                      params={{
                        propertyGroupSlug,
                      }}
                    >
                      Edit
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="
                      text-destructive
                      hover:text-destructive
                    "
                    disabled={deleteGroup.isPending}
                    onClick={() => deleteGroup.mutate(propertyGroup.id, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/property-groups",
                      }),
                    })}
                  >
                    {deleteGroup.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        propertyGroupSlug,
      }}
      navAriaLabel="Property group sections"
    />
  );
}
