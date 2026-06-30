import { Link, createFileRoute, useRouterState } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteLocation, useLocationBySlug } from "../hooks/useLocations";

import { Button } from "@/components/ui/button";

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

const VIEW_TO_EDIT = {
  "general": "/taxonomies/locations/$locationSlug/edit/general",
  "autofill": "/taxonomies/locations/$locationSlug/edit/autofill",
  "display-rules": "/taxonomies/locations/$locationSlug/edit/display-rules",
} as const;
type LocationEditRoute = typeof VIEW_TO_EDIT[keyof typeof VIEW_TO_EDIT];

function LocationViewLayout() {
  const {
    locationSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const pathname = useRouterState({
    select: s => s.location.pathname,
  });
  const editRoute: LocationEditRoute = (VIEW_TO_EDIT[pathname.split("/").at(-1) as keyof typeof VIEW_TO_EDIT] ?? VIEW_TO_EDIT.general) as LocationEditRoute;
  const {
    location, isLoading,
  } = useLocationBySlug(locationSlug);
  const deleteLocation = useDeleteLocation();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/locations"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to locations
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading ? "Location" : (location?.name ?? "Location not found")}
            </h1>
            {location
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to={editRoute}
                      params={{
                        locationSlug,
                      }}
                    >
                      Edit
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="
                      text-destructive
                      hover:text-destructive
                    "
                    disabled={deleteLocation.isPending}
                    onClick={() => deleteLocation.mutate(location.id, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/locations",
                      }),
                    })}
                  >
                    {deleteLocation.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        locationSlug,
      }}
      navAriaLabel="Location sections"
    />
  );
}
