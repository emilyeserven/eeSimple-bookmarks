import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useTvShowBySlug } from "../hooks/useTvShows";

export const Route = createFileRoute("/taxonomies/tv-shows/$tvShowSlug/edit")({
  component: TvShowEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/tv-shows/$tvShowSlug/edit/general",
    label: "General",
  },
  {
    to: "/taxonomies/tv-shows/$tvShowSlug/edit/image",
    label: "Image",
  },
] as const;

function TvShowEditLayout() {
  const {
    tvShowSlug,
  } = Route.useParams();
  const {
    tvShow, isLoading,
  } = useTvShowBySlug(tvShowSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/tv-shows/$tvShowSlug"
            params={{
              tvShowSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to {isLoading ? "TV show" : (tvShow?.name ?? "TV show")}
          </Link>
          <h1 className="text-2xl font-bold">Edit TV show</h1>
        </div>
      )}
      nav={editNav}
      params={{
        tvShowSlug,
      }}
      navAriaLabel="TV show edit sections"
    />
  );
}
