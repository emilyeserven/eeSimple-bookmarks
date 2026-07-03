import { Link, createFileRoute } from "@tanstack/react-router";

import { PlexTaxonomyViewHeader } from "../components/PlexTaxonomyViewHeader";
import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteEpisode, useEpisodeBySlug } from "../hooks/useEpisodes";
import { episodesApi } from "../lib/api/taxonomies";

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
        <PlexTaxonomyViewHeader
          ownerId={episode?.id}
          imagesApi={episodesApi.images}
          queryKeyPrefix="episode-images"
          backLink={(
            <Link
              to="/taxonomies/episodes"
              className="
                inline-block text-sm text-muted-foreground
                hover:text-foreground
              "
            >
              ← Back to episodes
            </Link>
          )}
          title={isLoading
            ? "Episode"
            : episode
              ? (
                <RomanizedLabel
                  name={episode.name}
                  romanized={episode.romanizedName}
                />
              )
              : "Episode not found"}
          actions={episode
            ? (
              <>
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
              </>
            )
            : undefined}
        />
      )}
      nav={viewNav}
      params={{
        episodeSlug,
      }}
      navAriaLabel="Episode sections"
    />
  );
}
