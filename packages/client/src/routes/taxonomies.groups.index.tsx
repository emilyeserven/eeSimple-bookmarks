import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AddGroupModal } from "../components/AddGroupModal";
import { GroupsListing } from "../components/GroupManager";
import { useGroups } from "../hooks/useGroups";
import { useSetListingPage } from "../hooks/useListingPage";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/groups/")({
  component: GroupsTaxonomyPage,
});

/** Browse view for the Groups taxonomy: every group with search filtering. */
function GroupsTaxonomyPage() {
  const {
    data: allGroups,
  } = useGroups();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("groups-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New group",
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Groups</h1>
          {allGroups
            ? (
              <Badge variant="secondary">
                {allGroups.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Browse the Groups taxonomy. Create a group, then assign them to bookmarks.
        </p>
      </div>

      <GroupsListing />

      <AddGroupModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(group) => {
          void navigate({
            to: "/taxonomies/groups/$groupSlug/edit/general",
            params: {
              groupSlug: group.slug,
            },
          });
        }}
      />
    </section>
  );
}
