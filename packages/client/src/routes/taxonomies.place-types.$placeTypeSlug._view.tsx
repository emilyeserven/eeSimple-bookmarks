import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeletePlaceType, usePlaceTypeBySlug } from "../hooks/usePlaceTypes";

import { Button } from "@/components/ui/button";

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
  const navigate = Route.useNavigate();
  const {
    placeType, isLoading,
  } = usePlaceTypeBySlug(placeTypeSlug);
  const deletePlaceType = useDeletePlaceType();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/place-types"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to place types
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading ? "Place type" : (placeType?.name ?? "Place type not found")}
            </h1>
            {placeType
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to="/taxonomies/place-types/$placeTypeSlug/edit/general"
                      params={{
                        placeTypeSlug,
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
                    disabled={deletePlaceType.isPending}
                    onClick={() => deletePlaceType.mutate({
                      id: placeType.id,
                    }, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/place-types",
                      }),
                    })}
                  >
                    {deletePlaceType.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        placeTypeSlug,
      }}
      navAriaLabel="Place type sections"
    />
  );
}
