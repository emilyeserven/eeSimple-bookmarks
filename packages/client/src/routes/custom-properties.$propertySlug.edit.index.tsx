import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { propertyWorkbench } from "../components/workbench/property";
import { usePropertyBySlug } from "../hooks/useCustomProperties";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/custom-properties/$propertySlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: CustomPropertyEditPage,
});

function CustomPropertyEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    propertySlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    property, isLoading,
  } = usePropertyBySlug(propertySlug);

  return (
    <EntityEditView
      workbench={propertyWorkbench}
      slug={propertySlug}
      editTo="/custom-properties/$propertySlug/edit"
      params={{
        propertySlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/custom-properties/$propertySlug"
            params={{
              propertySlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to custom property")}
          </Link>
          <h1 className="text-2xl font-bold">
            {isLoading ? t("Edit custom property") : (property?.name ?? t("Custom property not found"))}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("Edit the general details, options, categories, display, and autofill rules for this property.")}
          </p>
        </div>
      )}
    />
  );
}
