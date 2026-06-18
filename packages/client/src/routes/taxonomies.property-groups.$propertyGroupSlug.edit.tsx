import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { usePropertyGroupBySlug } from "../hooks/usePropertyGroups";

export const Route = createFileRoute("/taxonomies/property-groups/$propertyGroupSlug/edit")({
  component: PropertyGroupEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/property-groups/$propertyGroupSlug/edit/general",
    label: "General",
  },
] as const;

function PropertyGroupEditLayout() {
  const {
    propertyGroupSlug,
  } = Route.useParams();
  const {
    propertyGroup, isLoading,
  } = usePropertyGroupBySlug(propertyGroupSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/property-groups/$propertyGroupSlug"
            params={{
              propertyGroupSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to {isLoading ? "property group" : (propertyGroup?.name ?? "property group")}
          </Link>
          <h1 className="text-2xl font-bold">Edit property group</h1>
        </div>
      )}
      nav={editNav}
      params={{
        propertyGroupSlug,
      }}
      navAriaLabel="Property group edit sections"
    />
  );
}
