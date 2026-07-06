import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { placeTypeWorkbench } from "../components/workbench/placeType";
import { usePlaceTypeBySlug } from "../hooks/usePlaceTypes";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/place-types/$placeTypeSlug/info")({
  validateSearch: validateInfoTabSearch,
  component: PlaceTypeInfoTab,
});

function PlaceTypeInfoTab() {
  const {
    t,
  } = useTranslation();
  const {
    placeTypeSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    placeType, isLoading,
  } = usePlaceTypeBySlug(placeTypeSlug);

  return (
    <EntityInfoView
      workbench={placeTypeWorkbench}
      slug={placeTypeSlug}
      infoTo="/taxonomies/place-types/$placeTypeSlug/info"
      params={{
        placeTypeSlug,
      }}
      activeTab={tab}
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading ? t("Place type") : (placeType?.name ?? t("Place type not found"))}
        </h1>
      )}
    />
  );
}
