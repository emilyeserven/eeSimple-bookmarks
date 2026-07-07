import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

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
    t,
  } = useTranslation();
  const {
    data: allLocations,
  } = useLocations();
  const navigate = useNavigate();

  // Click → the full create page (geocoding lookup + ancestor chain).
  const createLocation = () => {
    void navigate({
      to: "/taxonomies/locations/new",
    });
  };
  useSetListingPage("locations-listing", {
    createAction: createLocation,
    addBookmark: {},
    createLabel: t("New location"),
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t("Locations")}</h1>
          {allLocations
            ? (
              <Badge variant="secondary">
                {allLocations.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {t("Browse the Locations taxonomy. Use “New location” to add a place — look it up to autograb its coordinates, and add higher-level locations in the same step. Click a location to view or edit it.")}
        </p>
      </div>

      <LocationsListing />
    </section>
  );
}
