import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AddPublisherModal } from "../components/AddPublisherModal";
import { PublishersListing } from "../components/PublisherManager";
import { useSetListingPage } from "../hooks/useListingPage";
import { usePublishers } from "../hooks/usePublishers";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/publishers/")({
  component: PublishersTaxonomyPage,
});

/** Browse view for the Publishers taxonomy: every publisher with search filtering. */
function PublishersTaxonomyPage() {
  const {
    data: allPublishers,
  } = usePublishers();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("publishers-listing", false, false, false, () => setModalOpen(true), false, {
    addBookmark: {},
    createLabel: "New publisher",
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Publishers</h1>
          {allPublishers
            ? (
              <Badge variant="secondary">
                {allPublishers.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Browse the Publishers taxonomy. Create a publisher, then assign them to bookmarks.
        </p>
      </div>

      <PublishersListing />

      <AddPublisherModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(publisher) => {
          void navigate({
            to: "/taxonomies/publishers/$publisherSlug/edit/general",
            params: {
              publisherSlug: publisher.slug,
            },
          });
        }}
      />
    </section>
  );
}
