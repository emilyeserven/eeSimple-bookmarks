import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { propertyGroupWorkbench } from "../components/workbench/propertyGroup";
import { usePropertyGroupBySlug } from "../hooks/usePropertyGroups";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/property-groups/$propertyGroupSlug/info")({
  validateSearch: validateInfoTabSearch,
  component: PropertyGroupInfoTab,
});

function PropertyGroupInfoTab() {
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
    <EntityInfoView
      workbench={propertyGroupWorkbench}
      slug={propertyGroupSlug}
      infoTo="/taxonomies/property-groups/$propertyGroupSlug/info"
      params={{
        propertyGroupSlug,
      }}
      activeTab={tab}
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading ? t("Property group") : (propertyGroup?.name ?? t("Property group not found"))}
        </h1>
      )}
    />
  );
}
