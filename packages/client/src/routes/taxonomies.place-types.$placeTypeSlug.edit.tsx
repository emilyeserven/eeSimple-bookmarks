import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { usePlaceTypeBySlug } from "../hooks/usePlaceTypes";

export const Route = createFileRoute("/taxonomies/place-types/$placeTypeSlug/edit")({
  component: PlaceTypeEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/place-types/$placeTypeSlug/edit/general",
    label: "General",
  },
] as const;

function PlaceTypeEditLayout() {
  const {
    placeTypeSlug,
  } = Route.useParams();
  const {
    placeType, isLoading,
  } = usePlaceTypeBySlug(placeTypeSlug);

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
            ← Back to {isLoading ? "place type" : (placeType?.name ?? "place type")}
          </Link>
          <h1 className="text-2xl font-bold">Edit place type</h1>
        </div>
      )}
      nav={editNav}
      params={{
        placeTypeSlug,
      }}
      navAriaLabel="Place type edit sections"
    />
  );
}
