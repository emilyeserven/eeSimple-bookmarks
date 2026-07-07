import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { propertyGroupWorkbench } from "../components/workbench/propertyGroup";
import { usePropertyGroupBySlug } from "../hooks/usePropertyGroups";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/property-groups/$propertyGroupSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: PropertyGroupEditPage,
});

function PropertyGroupEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    propertyGroupSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    propertyGroup, isLoading,
  } = usePropertyGroupBySlug(propertyGroupSlug);

  return (
    <EntityEditView
      workbench={propertyGroupWorkbench}
      slug={propertyGroupSlug}
      editTo="/taxonomies/property-groups/$propertyGroupSlug/edit"
      params={{
        propertyGroupSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/property-groups/$propertyGroupSlug"
            params={{
              propertyGroupSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("property group") : (propertyGroup?.name ?? t("property group")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit property group")}</h1>
        </div>
      )}
    />
  );
}
