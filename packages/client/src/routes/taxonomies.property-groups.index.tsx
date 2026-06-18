import { createFileRoute } from "@tanstack/react-router";

import { PropertyGroupsListing } from "../components/PropertyGroupManager";
import { usePropertyGroups } from "../hooks/usePropertyGroups";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/property-groups/")({
  component: PropertyGroupsPage,
});

/** Browse view for Property Groups: every group with search filtering. */
function PropertyGroupsPage() {
  const {
    data: allGroups,
  } = usePropertyGroups();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Property Groups</h1>
          {allGroups
            ? (
              <Badge variant="secondary">
                {allGroups.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Organize custom properties into groups. Grouped properties render together on bookmark
          detail pages and in the listings filters. Click a group to view or edit it.
        </p>
      </div>

      <PropertyGroupsListing />
    </section>
  );
}
