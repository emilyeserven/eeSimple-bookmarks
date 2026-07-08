import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { locationRelationWorkbench } from "../components/workbench/locationRelation";
import { useLocationRelationBySlug } from "../hooks/useLocationRelations";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/location-relations/$locationRelationSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: LocationRelationEditPage,
});

function LocationRelationEditPage() {
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
    <EntityEditView
      workbench={locationRelationWorkbench}
      slug={locationRelationSlug}
      editTo="/taxonomies/location-relations/$locationRelationSlug/edit"
      params={{
        locationRelationSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/location-relations/$locationRelationSlug"
            params={{
              locationRelationSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("location relation") : (locationRelation?.name ?? t("location relation")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit location relation")}</h1>
        </div>
      )}
    />
  );
}
