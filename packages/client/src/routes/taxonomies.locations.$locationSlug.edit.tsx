import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useLocationBySlug } from "../hooks/useLocations";

export const Route = createFileRoute("/taxonomies/locations/$locationSlug/edit")({
  component: LocationEditLayout,
});

function LocationEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    locationSlug,
  } = Route.useParams();
  const {
    location, isLoading,
  } = useLocationBySlug(locationSlug);

  const editNav = [
    {
      to: "/taxonomies/locations/$locationSlug/edit/general",
      label: t("General"),
    },
    {
      type: "group",
      label: t("Rules"),
      items: [
        {
          to: "/taxonomies/locations/$locationSlug/edit/autofill",
          label: t("Autofill Rules"),
        },
        {
          to: "/taxonomies/locations/$locationSlug/edit/display-rules",
          label: t("Display Rules"),
        },
      ],
    },
  ] as const;

  return (
    <TabbedEntityLayout
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
      nav={editNav}
      params={{
        locationSlug,
      }}
      navAriaLabel={t("Location edit sections")}
    />
  );
}
