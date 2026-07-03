import { createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { usePlaceTypeBySlug } from "../hooks/usePlaceTypes";

export const Route = createFileRoute("/taxonomies/place-types/$placeTypeSlug/_view")({
  component: PlaceTypeViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/place-types/$placeTypeSlug/general",
    label: "General",
  },
] as const;

function PlaceTypeViewLayout() {
  const {
    placeTypeSlug,
  } = Route.useParams();
  const {
    placeType, isLoading,
  } = usePlaceTypeBySlug(placeTypeSlug);

  return (
    <TabbedEntityLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading ? "Place type" : (placeType?.name ?? "Place type not found")}
        </h1>
      )}
      nav={viewNav}
      params={{
        placeTypeSlug,
      }}
      navAriaLabel="Place type sections"
    />
  );
}
