import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LocationRelationsListing } from "../components/LocationRelationManager";
import { useLocationRelations } from "../hooks/useLocationRelations";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/location-relations/")({
  component: LocationRelationsPage,
});

/** Browse view for Location Relations: how bookmarks relate to their locations. */
function LocationRelationsPage() {
  const {
    t,
  } = useTranslation();
  const {
    data: allRelations,
  } = useLocationRelations();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t("Location Relations")}</h1>
          {allRelations
            ? (
              <Badge variant="secondary">
                {allRelations.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {t(
            "Location relations describe how a bookmark relates to one of its locations (e.g. Physical Place, Culture and Tradition, Created In, Inspired By). Attach one per location on a bookmark’s Locations. Manage the full vocabulary — including merging and reassigning — in Settings → Locations → Location Relations.",
          )}
        </p>
      </div>

      <LocationRelationsListing />
    </section>
  );
}
