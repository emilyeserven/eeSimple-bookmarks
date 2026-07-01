import type { MouseEvent } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { LocationsListing } from "../components/LocationManager";
import { usePanelControls } from "../components/panel/usePanelControls";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { useSetListingPage } from "../hooks/useListingPage";
import { useLocations } from "../hooks/useLocations";

import { Badge } from "@/components/ui/badge";
import { NEW_SENTINEL } from "@/lib/drawerSearch";
import { hasSidebarModifier } from "@/lib/sidebarModifier";

export const Route = createFileRoute("/taxonomies/locations/")({
  component: LocationsTaxonomyPage,
});

/** Browse view for the Locations taxonomy: every known location with search filtering. */
function LocationsTaxonomyPage() {
  const {
    data: allLocations,
  } = useLocations();
  const navigate = useNavigate();
  const {
    openItem,
  } = usePanelControls();
  const modifier = useSidebarOpenModifier();

  // Normal click → the full create page (geocoding lookup + ancestor chain). Modifier-click opens the
  // same LocationForm in the right drawer, keeping the drawer and main app at parity.
  const createLocation = (event?: MouseEvent) => {
    if (event && hasSidebarModifier(event, modifier)) {
      openItem("location", NEW_SENTINEL, "edit");
      return;
    }
    void navigate({
      to: "/taxonomies/locations/new",
    });
  };
  useSetListingPage("locations-listing", false, false, false, createLocation, false, {
    addBookmark: {},
    createLabel: "New location",
  });

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
          Browse the Locations taxonomy. Use “New location” to add a place — look it up to autograb its
          coordinates, and add higher-level locations in the same step. Click a location to view or edit it.
        </p>
      </div>

      <LocationsListing />
    </section>
  );
}
