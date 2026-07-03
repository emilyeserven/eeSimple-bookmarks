import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { usePodcastBySlug } from "../hooks/usePodcasts";

export const Route = createFileRoute("/taxonomies/podcasts/$podcastSlug/edit")({
  component: PodcastEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/podcasts/$podcastSlug/edit/general",
    label: "General",
  },
  {
    to: "/taxonomies/podcasts/$podcastSlug/edit/image",
    label: "Image",
  },
] as const;

function PodcastEditLayout() {
  const {
    podcastSlug,
  } = Route.useParams();
  const {
    podcast, isLoading,
  } = usePodcastBySlug(podcastSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/podcasts/$podcastSlug"
            params={{
              podcastSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to {isLoading ? "podcast" : (podcast?.name ?? "podcast")}
          </Link>
          <h1 className="text-2xl font-bold">Edit podcast</h1>
        </div>
      )}
      nav={editNav}
      params={{
        podcastSlug,
      }}
      navAriaLabel="Podcast edit sections"
    />
  );
}
