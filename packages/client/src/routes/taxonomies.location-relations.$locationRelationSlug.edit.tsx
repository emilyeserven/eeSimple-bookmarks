import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useLocationRelationBySlug } from "../hooks/useLocationRelations";

export const Route = createFileRoute("/taxonomies/location-relations/$locationRelationSlug/edit")({
  component: LocationRelationEditLayout,
});

function LocationRelationEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    locationRelationSlug,
  } = Route.useParams();
  const {
    locationRelation, isLoading,
  } = useLocationRelationBySlug(locationRelationSlug);
  const editNav = [
    {
      to: "/taxonomies/location-relations/$locationRelationSlug/edit/general",
      label: t("General"),
    },
  ] as const;

  return (
    <TabbedEntityLayout
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
      nav={editNav}
      params={{
        locationRelationSlug,
      }}
      navAriaLabel={t("Location relation edit sections")}
    />
  );
}
