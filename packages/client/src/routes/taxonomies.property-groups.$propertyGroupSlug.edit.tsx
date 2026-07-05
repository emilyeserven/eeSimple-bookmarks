import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { usePropertyGroupBySlug } from "../hooks/usePropertyGroups";

export const Route = createFileRoute("/taxonomies/property-groups/$propertyGroupSlug/edit")({
  component: PropertyGroupEditLayout,
});

function PropertyGroupEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    propertyGroupSlug,
  } = Route.useParams();
  const {
    propertyGroup, isLoading,
  } = usePropertyGroupBySlug(propertyGroupSlug);
  const editNav = [
    {
      to: "/taxonomies/property-groups/$propertyGroupSlug/edit/general",
      label: t("General"),
    },
  ] as const;

  return (
    <TabbedEntityLayout
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
      nav={editNav}
      params={{
        propertyGroupSlug,
      }}
      navAriaLabel={t("Property group edit sections")}
    />
  );
}
