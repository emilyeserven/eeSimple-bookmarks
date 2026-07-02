import { useMemo, useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AddTagModal } from "../components/AddTagModal";
import { TreeListingScaffold } from "../components/TreeListingScaffold";
import { buildTagTreeListingConfig } from "../entities/tag";
import { useSetListingPage } from "../hooks/useListingPage";
import { useTags } from "../hooks/useTags";
import { useTreeListingScaffold } from "../hooks/useTreeListingScaffold";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/tags/")({
  component: TagsListingPage,
});

/** Browse view for the Tags taxonomy: the full tag tree. Click a tag to view it, or add one. */
function TagsListingPage() {
  const {
    data: tags,
  } = useTags();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("tags-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New tag",
  });

  // The config is a factory only because the empty state's "Add your first tag" button opens the modal.
  const config = useMemo(() => buildTagTreeListingConfig({
    onNew: () => setModalOpen(true),
  }), []);
  const state = useTreeListingScaffold(config);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Tags</h1>
          {tags
            ? <Badge variant="secondary">{tags.length}</Badge>
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Browse the tag taxonomy. Click a tag to view and edit it.
        </p>
      </div>

      <TreeListingScaffold
        config={config}
        state={state}
      />

      <AddTagModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(tag) => {
          void navigate({
            to: "/tags/$tagSlug/edit/general",
            params: {
              tagSlug: tag.slug,
            },
          });
        }}
      />
    </section>
  );
}
