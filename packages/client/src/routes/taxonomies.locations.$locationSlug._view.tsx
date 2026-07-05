import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useLocationBySlug } from "../hooks/useLocations";
import i18n from "../i18n";

export const Route = createFileRoute("/taxonomies/locations/$locationSlug/_view")({
  component: LocationViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/locations/$locationSlug/general",
    label: i18n.t("General"),
  },
  {
    to: "/taxonomies/locations/$locationSlug/hierarchy",
    label: i18n.t("Hierarchy"),
  },
  {
    type: "group",
    label: i18n.t("Rules"),
    items: [
      {
        to: "/taxonomies/locations/$locationSlug/autofill",
        label: i18n.t("Autofill Rules"),
      },
      {
        to: "/taxonomies/locations/$locationSlug/display-rules",
        label: i18n.t("Display Rules"),
      },
    ],
  },
] as const;

function LocationViewLayout() {
  const {
    t,
  } = useTranslation();
  const {
    locationSlug,
  } = Route.useParams();
  const {
    location, isLoading,
  } = useLocationBySlug(locationSlug);

  return (
    <TabbedEntityLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading
            ? t("Location")
            : location
              ? (
                <LocalizedNameLabel
                  names={location.names ?? []}
                  base={location.name}
                  stacked
                />
              )
              : t("Location not found")}
        </h1>
      )}
      nav={viewNav}
      params={{
        locationSlug,
      }}
      navAriaLabel={t("Location sections")}
    />
  );
}
