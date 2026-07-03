import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useGroupTypeBySlug } from "../hooks/useGroupTypes";

export const Route = createFileRoute("/taxonomies/group-types/$groupTypeSlug/edit")({
  component: GroupTypeEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/group-types/$groupTypeSlug/edit/general",
    label: "General",
  },
] as const;

function GroupTypeEditLayout() {
  const {
    groupTypeSlug,
  } = Route.useParams();
  const {
    groupType, isLoading,
  } = useGroupTypeBySlug(groupTypeSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/group-types/$groupTypeSlug"
            params={{
              groupTypeSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to {isLoading ? "group type" : (groupType?.name ?? "group type")}
          </Link>
          <h1 className="text-2xl font-bold">Edit group type</h1>
        </div>
      )}
      nav={editNav}
      params={{
        groupTypeSlug,
      }}
      navAriaLabel="Group type edit sections"
    />
  );
}
