import { createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useGroupBySlug } from "../hooks/useGroups";

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
  const {
    group, isLoading,
  } = useGroupBySlug(groupSlug);

  return (
    <TabbedEntityLayout
      header={(
        <TaxonomyViewHeader
          image={{
            kind: "url",
            url: group?.imageUrl ?? null,
          }}
          title={group
            ? (
              <RomanizedLabel
                name={group.name}
                romanized={group.romanizedName}
              />
            )
            : (isLoading ? "Group" : "Group not found")}
        />
      )}
      nav={viewNav}
      params={{
        groupSlug,
      }}
      navAriaLabel="Group sections"
    />
  );
}
