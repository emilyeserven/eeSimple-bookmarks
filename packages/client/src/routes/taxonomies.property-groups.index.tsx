import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AddPropertyGroupModal } from "../components/AddPropertyGroupModal";
import { PropertyGroupsListing } from "../components/PropertyGroupManager";
import { usePropertyGroups } from "../hooks/usePropertyGroups";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/property-groups/")({
  component: PropertyGroupsPage,
});

/** Browse view for Property Groups: every group with search filtering. */
function PropertyGroupsPage() {
  const {
    data: allGroups,
  } = usePropertyGroups();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
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
          <Button
            type="button"
            size="sm"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="size-4" />
            New property group
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Organize custom properties into groups. Grouped properties render together on bookmark
          detail pages and in the listings filters. Click a group to view or edit it.
        </p>
      </div>

      <PropertyGroupsListing />

      <AddPropertyGroupModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(group) => {
          void navigate({
            to: "/taxonomies/property-groups/$propertyGroupSlug/edit/general",
            params: {
              propertyGroupSlug: group.slug,
            },
          });
        }}
      />
    </section>
  );
}
