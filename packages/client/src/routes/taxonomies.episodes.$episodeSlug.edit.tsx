import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useEpisodeBySlug } from "../hooks/useEpisodes";

export const Route = createFileRoute("/taxonomies/episodes/$episodeSlug/edit")({
  component: EpisodeEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/episodes/$episodeSlug/edit/general",
    label: "General",
  },
  {
    to: "/taxonomies/episodes/$episodeSlug/edit/image",
    label: "Image",
  },
] as const;

function EpisodeEditLayout() {
  const {
    episodeSlug,
  } = Route.useParams();
  const {
    episode, isLoading,
  } = useEpisodeBySlug(episodeSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/episodes/$episodeSlug"
            params={{
              episodeSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to {isLoading ? "episode" : (episode?.name ?? "episode")}
          </Link>
          <h1 className="text-2xl font-bold">Edit episode</h1>
        </div>
      )}
      nav={editNav}
      params={{
        episodeSlug,
      }}
      navAriaLabel="Episode edit sections"
    />
  );
}
