import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { locationRelationWorkbench } from "../components/workbench/locationRelation";
import { useLocationRelationBySlug } from "../hooks/useLocationRelations";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/location-relations/$locationRelationSlug/info")({
  validateSearch: validateInfoTabSearch,
  component: LocationRelationInfoTab,
});

function LocationRelationInfoTab() {
  const {
    t,
  } = useTranslation();
  const {
    locationRelationSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    locationRelation, isLoading,
  } = useLocationRelationBySlug(locationRelationSlug);

  return (
    <EntityInfoView
      workbench={locationRelationWorkbench}
      slug={locationRelationSlug}
      infoTo="/taxonomies/location-relations/$locationRelationSlug/info"
      params={{
        locationRelationSlug,
      }}
      activeTab={tab}
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading ? t("Location relation") : (locationRelation?.name ?? t("Location relation not found"))}
        </h1>
      )}
    />
  );
}
