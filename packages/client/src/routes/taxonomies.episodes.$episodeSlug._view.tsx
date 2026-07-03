import { Link, createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteEpisode, useEpisodeBySlug } from "../hooks/useEpisodes";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/episodes/$episodeSlug/_view")({
  component: EpisodeViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/episodes/$episodeSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/episodes/$episodeSlug/image",
    label: "Image",
  },
] as const;

function EpisodeViewLayout() {
  const {
    episodeSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    episode, isLoading,
  } = useEpisodeBySlug(episodeSlug);
  const deleteEpisode = useDeleteEpisode();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/episodes"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to episodes
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading
                ? "Episode"
                : episode
                  ? (
                    <RomanizedLabel
                      name={episode.name}
                      romanized={episode.romanizedName}
                    />
                  )
                  : "Episode not found"}
            </h1>
            {episode
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to="/taxonomies/episodes/$episodeSlug/edit/general"
                      params={{
                        episodeSlug,
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
                    disabled={deleteEpisode.isPending}
                    onClick={() => deleteEpisode.mutate(episode.id, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/episodes",
                      }),
                    })}
                  >
                    {deleteEpisode.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        episodeSlug,
      }}
      navAriaLabel="Episode sections"
    />
  );
}
