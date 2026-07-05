import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { usePropertyGroupBySlug } from "../hooks/usePropertyGroups";

import i18n from "@/i18n";

export const Route = createFileRoute("/taxonomies/property-groups/$propertyGroupSlug/_view")({
  component: PropertyGroupViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/property-groups/$propertyGroupSlug/general",
    label: i18n.t("General"),
  },
] as const;

function PropertyGroupViewLayout() {
  const {
    t,
  } = useTranslation();
  const {
    propertyGroupSlug,
  } = Route.useParams();
  const {
    propertyGroup, isLoading,
  } = usePropertyGroupBySlug(propertyGroupSlug);

  return (
    <TabbedEntityLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading ? t("Property group") : (propertyGroup?.name ?? t("Property group not found"))}
        </h1>
      )}
      nav={viewNav}
      params={{
        propertyGroupSlug,
      }}
      navAriaLabel={t("Property group sections")}
    />
  );
}
