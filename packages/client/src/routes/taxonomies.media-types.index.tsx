import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AddMediaTypeModal } from "../components/AddMediaTypeModal";
import { MediaTypesListing } from "../components/MediaTypeManager";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useSetListingPage } from "../hooks/useListingPage";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/media-types/")({
  component: MediaTypesTaxonomyPage,
});

/** Browse view for the Media Types taxonomy: every known type with search filtering. */
function MediaTypesTaxonomyPage() {
  const {
    data: allMediaTypes,
  } = useMediaTypes();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("media-types-listing");

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Media Types</h1>
            {allMediaTypes
              ? (
                <Badge variant="secondary">
                  {allMediaTypes.length}
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
            New media type
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Browse the Media Types taxonomy. Built-in types ship with the app; add your own below. Click
          a type to view or edit it.
        </p>
      </div>

      <MediaTypesListing />

      <AddMediaTypeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(mediaType) => {
          void navigate({
            to: "/taxonomies/media-types/$mediaTypeSlug/edit/general",
            params: {
              mediaTypeSlug: mediaType.slug,
            },
          });
        }}
      />
    </section>
  );
}
