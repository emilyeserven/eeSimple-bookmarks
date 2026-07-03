import { createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { usePropertyGroupBySlug } from "../hooks/usePropertyGroups";

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
  const {
    propertyGroup, isLoading,
  } = usePropertyGroupBySlug(propertyGroupSlug);

  return (
    <TabbedEntityLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading ? "Property group" : (propertyGroup?.name ?? "Property group not found")}
        </h1>
      )}
      nav={viewNav}
      params={{
        propertyGroupSlug,
      }}
      navAriaLabel="Property group sections"
    />
  );
}
