import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { placeTypeWorkbench } from "../components/workbench/placeType";
import { usePlaceTypeBySlug } from "../hooks/usePlaceTypes";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/place-types/$placeTypeSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: PlaceTypeEditPage,
});

function PlaceTypeEditPage() {
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
    <EntityEditView
      workbench={placeTypeWorkbench}
      slug={placeTypeSlug}
      editTo="/taxonomies/place-types/$placeTypeSlug/edit"
      params={{
        placeTypeSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/place-types/$placeTypeSlug"
            params={{
              placeTypeSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("place type") : (placeType?.name ?? t("place type")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit place type")}</h1>
        </div>
      )}
    />
  );
}
