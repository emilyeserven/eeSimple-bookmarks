import { Link, createFileRoute } from "@tanstack/react-router";

import { PlexTaxonomyViewHeader } from "../components/PlexTaxonomyViewHeader";
import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteTvShow, useTvShowBySlug } from "../hooks/useTvShows";
import { tvShowsApi } from "../lib/api/taxonomies";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/tv-shows/$tvShowSlug/_view")({
  component: TvShowViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/tv-shows/$tvShowSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/tv-shows/$tvShowSlug/image",
    label: "Image",
  },
] as const;

function TvShowViewLayout() {
  const {
    tvShowSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    tvShow, isLoading,
  } = useTvShowBySlug(tvShowSlug);
  const deleteTvShow = useDeleteTvShow();

  return (
    <TabbedEntityLayout
      header={(
        <PlexTaxonomyViewHeader
          ownerId={tvShow?.id}
          imagesApi={tvShowsApi.images}
          queryKeyPrefix="tvShow-images"
          backLink={(
            <Link
              to="/taxonomies/tv-shows"
              className="
                inline-block text-sm text-muted-foreground
                hover:text-foreground
              "
            >
              ← Back to TV shows
            </Link>
          )}
          title={isLoading
            ? "TV Show"
            : tvShow
              ? (
                <RomanizedLabel
                  name={tvShow.name}
                  romanized={tvShow.romanizedName}
                />
              )
              : "TV show not found"}
          actions={tvShow
            ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <Link
                    to="/taxonomies/tv-shows/$tvShowSlug/edit/general"
                    params={{
                      tvShowSlug,
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
                  disabled={deleteTvShow.isPending}
                  onClick={() => deleteTvShow.mutate(tvShow.id, {
                    onSuccess: () => navigate({
                      to: "/taxonomies/tv-shows",
                    }),
                  })}
                >
                  {deleteTvShow.isPending ? "Deleting…" : "Delete"}
                </Button>
              </>
            )
            : undefined}
        />
      )}
      nav={viewNav}
      params={{
        tvShowSlug,
      }}
      navAriaLabel="TV show sections"
    />
  );
}
