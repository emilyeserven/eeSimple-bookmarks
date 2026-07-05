import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { usePlaceTypeBySlug } from "../hooks/usePlaceTypes";

export const Route = createFileRoute("/taxonomies/place-types/$placeTypeSlug/edit")({
  component: PlaceTypeEditLayout,
});

function PlaceTypeEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    placeTypeSlug,
  } = Route.useParams();
  const {
    placeType, isLoading,
  } = usePlaceTypeBySlug(placeTypeSlug);
  const editNav = [
    {
      to: "/taxonomies/place-types/$placeTypeSlug/edit/general",
      label: t("General"),
    },
  ] as const;

  return (
    <TabbedEntityLayout
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
      nav={editNav}
      params={{
        placeTypeSlug,
      }}
      navAriaLabel={t("Place type edit sections")}
    />
  );
}
