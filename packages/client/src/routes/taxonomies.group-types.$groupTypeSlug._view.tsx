import { createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useGroupTypeBySlug } from "../hooks/useGroupTypes";

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
  const {
    groupType, isLoading,
  } = useGroupTypeBySlug(groupTypeSlug);

  return (
    <TabbedEntityLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading ? "Group type" : (groupType?.name ?? "Group type not found")}
        </h1>
      )}
      nav={viewNav}
      params={{
        groupTypeSlug,
      }}
      navAriaLabel="Group type sections"
    />
  );
}
