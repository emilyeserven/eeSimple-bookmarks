import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteTvShow, useTvShowBySlug } from "../hooks/useTvShows";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/tv-shows/$tvShowSlug/_view")({
  component: TvShowViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/tv-shows/$tvShowSlug/general",
    label: "General",
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
        <div className="space-y-1">
          <Link
            to="/taxonomies/tv-shows"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to TV shows
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading ? "TV show" : (tvShow?.name ?? "TV show not found")}
            </h1>
            {tvShow
              ? (
                <div className="flex shrink-0 items-center gap-1">
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
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        tvShowSlug,
      }}
      navAriaLabel="TV show sections"
    />
  );
}
