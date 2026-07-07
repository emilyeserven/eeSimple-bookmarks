import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { locationWorkbench } from "../components/workbench/location";
import { useLocationBySlug } from "../hooks/useLocations";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/locations/$locationSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: LocationEditPage,
});

function LocationEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    locationSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    location, isLoading,
  } = useLocationBySlug(locationSlug);

  return (
    <EntityEditView
      workbench={locationWorkbench}
      slug={locationSlug}
      editTo="/taxonomies/locations/$locationSlug/edit"
      params={{
        locationSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/locations/$locationSlug"
            params={{
              locationSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("location") : (location?.name ?? t("location")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit location")}</h1>
        </div>
      )}
    />
  );
}
