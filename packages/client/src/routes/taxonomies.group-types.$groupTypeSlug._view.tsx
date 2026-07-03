import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteGroupType, useGroupTypeBySlug } from "../hooks/useGroupTypes";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/group-types/$groupTypeSlug/_view")({
  component: GroupTypeViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/group-types/$groupTypeSlug/general",
    label: "General",
  },
] as const;

function GroupTypeViewLayout() {
  const {
    groupTypeSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    groupType, isLoading,
  } = useGroupTypeBySlug(groupTypeSlug);
  const deleteGroupType = useDeleteGroupType();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/group-types"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to group types
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading ? "Group type" : (groupType?.name ?? "Group type not found")}
            </h1>
            {groupType
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to="/taxonomies/group-types/$groupTypeSlug/edit/general"
                      params={{
                        groupTypeSlug,
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
                    disabled={deleteGroupType.isPending}
                    onClick={() => deleteGroupType.mutate(groupType.id, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/group-types",
                      }),
                    })}
                  >
                    {deleteGroupType.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        groupTypeSlug,
      }}
      navAriaLabel="Group type sections"
    />
  );
}
