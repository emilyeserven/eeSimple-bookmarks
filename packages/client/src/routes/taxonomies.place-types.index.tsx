import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { PlaceTypesListing } from "../components/PlaceTypeManager";
import { usePlaceTypes } from "../hooks/usePlaceTypes";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/place-types/")({
  component: PlaceTypesPage,
});

/** Browse view for Place Types: every place type used to classify your locations. */
function PlaceTypesPage() {
  const {
    t,
  } = useTranslation();
  const {
    data: allPlaceTypes,
  } = usePlaceTypes();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t("Place Types")}</h1>
          {allPlaceTypes
            ? (
              <Badge variant="secondary">
                {allPlaceTypes.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {t(
            "Place types classify your locations (e.g. city, state, country). Click one to view the locations that use it on a map, or to rename it. Manage the full vocabulary — including merging and reassigning — in Settings → Locations → Place Types.",
          )}
        </p>
      </div>

      <PlaceTypesListing />
    </section>
  );
}
