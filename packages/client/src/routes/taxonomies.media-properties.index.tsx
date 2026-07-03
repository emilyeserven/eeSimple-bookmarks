import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AddMediaPropertyModal } from "../components/AddMediaPropertyModal";
import { MediaPropertiesListing } from "../components/MediaPropertyManager";
import { useSetListingPage } from "../hooks/useListingPage";
import { useMediaProperties } from "../hooks/useMediaProperties";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/media-properties/")({
  component: MediaPropertiesPage,
});

/** Browse view for Media Properties: every media property with search filtering. */
function MediaPropertiesPage() {
  const {
    data: allMediaProperties,
  } = useMediaProperties();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("media-properties-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New media property",
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Media Properties</h1>
          {allMediaProperties
            ? (
              <Badge variant="secondary">
                {allMediaProperties.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Franchises and IP groupings (e.g. a book series). Group related books under a media
          property. Click one to view or edit it.
        </p>
      </div>

      <MediaPropertiesListing />

      <AddMediaPropertyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(mediaProperty) => {
          void navigate({
            to: "/taxonomies/media-properties/$mediaPropertySlug/edit/general",
            params: {
              mediaPropertySlug: mediaProperty.slug,
            },
          });
        }}
      />
    </section>
  );
}
