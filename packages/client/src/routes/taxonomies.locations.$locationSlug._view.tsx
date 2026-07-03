import { createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useLocationBySlug } from "../hooks/useLocations";

export const Route = createFileRoute("/taxonomies/locations/$locationSlug/_view")({
  component: LocationViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/locations/$locationSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/locations/$locationSlug/hierarchy",
    label: "Hierarchy",
  },
  {
    to: "/taxonomies/locations/$locationSlug/gallery",
    label: "Gallery",
  },
  {
    type: "group",
    label: "Rules",
    items: [
      {
        to: "/taxonomies/locations/$locationSlug/autofill",
        label: "Autofill Rules",
      },
      {
        to: "/taxonomies/locations/$locationSlug/display-rules",
        label: "Display Rules",
      },
    ],
  },
] as const;

function LocationViewLayout() {
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
            ? "Location"
            : location
              ? (
                <RomanizedLabel
                  name={location.name}
                  romanized={location.romanizedName}
                  stacked
                />
              )
              : "Location not found"}
        </h1>
      )}
      nav={viewNav}
      params={{
        locationSlug,
      }}
      navAriaLabel="Location sections"
    />
  );
}
