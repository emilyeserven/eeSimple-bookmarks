import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AddLocationModal } from "../components/AddLocationModal";
import { LocationsListing } from "../components/LocationManager";
import { useSetListingPage } from "../hooks/useListingPage";
import { useLocations } from "../hooks/useLocations";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/locations/")({
  component: LocationsTaxonomyPage,
});

/** Browse view for the Locations taxonomy: every known location with search filtering. */
function LocationsTaxonomyPage() {
  const {
    data: allLocations,
  } = useLocations();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("locations-listing", false, false, false, () => setModalOpen(true));

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Locations</h1>
          {allLocations
            ? (
              <Badge variant="secondary">
                {allLocations.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Browse the Locations taxonomy. Add a place below — look it up to prefill its coordinates.
          Click a location to view or edit it.
        </p>
      </div>

      <LocationsListing />

      <AddLocationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(location) => {
          void navigate({
            to: "/taxonomies/locations/$locationSlug/edit/general",
            params: {
              locationSlug: location.slug,
            },
          });
        }}
      />
    </section>
  );
}
