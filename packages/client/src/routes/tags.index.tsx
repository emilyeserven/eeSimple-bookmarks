import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AddTagModal } from "../components/AddTagModal";
import { TagManager } from "../components/TagManager";
import { useSetListingPage } from "../hooks/useListingPage";
import { useTags } from "../hooks/useTags";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  useSetListingPage("tags-listing");

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
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
        <Button
          type="button"
          size="sm"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="size-4" />
          New tag
        </Button>
      </div>

      <TagManager onNew={() => setModalOpen(true)} />

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
