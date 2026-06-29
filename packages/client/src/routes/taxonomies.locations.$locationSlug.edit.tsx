import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useLocationBySlug } from "../hooks/useLocations";

export const Route = createFileRoute("/taxonomies/locations/$locationSlug/edit")({
  component: LocationEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/locations/$locationSlug/edit/general",
    label: "General",
  },
  {
    type: "group",
    label: "Rules",
    items: [
      {
        to: "/taxonomies/locations/$locationSlug/edit/autofill",
        label: "Autofill Rules",
      },
      {
        to: "/taxonomies/locations/$locationSlug/edit/display-rules",
        label: "Display Rules",
      },
    ],
  },
] as const;

function LocationEditLayout() {
  const {
    locationSlug,
  } = Route.useParams();
  const {
    location, isLoading,
  } = useLocationBySlug(locationSlug);

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
            ← Back to {isLoading ? "location" : (location?.name ?? "location")}
          </Link>
          <h1 className="text-2xl font-bold">Edit location</h1>
        </div>
      )}
      nav={editNav}
      params={{
        locationSlug,
      }}
      navAriaLabel="Location edit sections"
    />
  );
}
