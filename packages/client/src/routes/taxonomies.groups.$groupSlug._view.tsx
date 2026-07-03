import { createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteGroup, useGroupBySlug } from "../hooks/useGroups";

export const Route = createFileRoute("/taxonomies/groups/$groupSlug/_view")({
  component: GroupViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/groups/$groupSlug/general",
    label: "General",
  },
] as const;

function GroupViewLayout() {
  const {
    groupSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    group, isLoading,
  } = useGroupBySlug(groupSlug);
  const deleteGroup = useDeleteGroup();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {isLoading ? "Group" : (group?.name ?? "Group not found")}
            </h1>
            {group
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="
                      inline-flex items-center justify-center rounded-md border
                      bg-background px-3 py-1.5 text-sm font-medium
                      hover:bg-accent hover:text-accent-foreground
                    "
                    onClick={() => void navigate({
                      to: "/taxonomies/groups/$groupSlug/edit/general",
                      params: {
                        groupSlug,
                      },
                    })}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="
                      inline-flex items-center justify-center rounded-md px-3
                      py-1.5 text-sm font-medium text-destructive
                      hover:text-destructive/80
                    "
                    disabled={deleteGroup.isPending}
                    onClick={() => deleteGroup.mutate(group.id, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/groups",
                      }),
                    })}
                  >
                    {deleteGroup.isPending ? "Deleting…" : "Delete"}
                  </button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        groupSlug,
      }}
      navAriaLabel="Group sections"
    />
  );
}
