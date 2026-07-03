import { Link, createFileRoute } from "@tanstack/react-router";

import { PlexTaxonomyViewHeader } from "../components/PlexTaxonomyViewHeader";
import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeletePodcast, usePodcastBySlug } from "../hooks/usePodcasts";
import { podcastsApi } from "../lib/api/taxonomies";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/podcasts/$podcastSlug/_view")({
  component: PodcastViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/podcasts/$podcastSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/podcasts/$podcastSlug/image",
    label: "Image",
  },
] as const;

function PodcastViewLayout() {
  const {
    podcastSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    podcast, isLoading,
  } = usePodcastBySlug(podcastSlug);
  const deletePodcast = useDeletePodcast();

  return (
    <TabbedEntityLayout
      header={(
        <PlexTaxonomyViewHeader
          ownerId={podcast?.id}
          imagesApi={podcastsApi.images}
          queryKeyPrefix="podcast-images"
          backLink={(
            <Link
              to="/taxonomies/podcasts"
              className="
                inline-block text-sm text-muted-foreground
                hover:text-foreground
              "
            >
              ← Back to podcasts
            </Link>
          )}
          title={isLoading
            ? "Podcast"
            : podcast
              ? (
                <RomanizedLabel
                  name={podcast.name}
                  romanized={podcast.romanizedName}
                />
              )
              : "Podcast not found"}
          actions={podcast
            ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <Link
                    to="/taxonomies/podcasts/$podcastSlug/edit/general"
                    params={{
                      podcastSlug,
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
                  disabled={deletePodcast.isPending}
                  onClick={() => deletePodcast.mutate(podcast.id, {
                    onSuccess: () => navigate({
                      to: "/taxonomies/podcasts",
                    }),
                  })}
                >
                  {deletePodcast.isPending ? "Deleting…" : "Delete"}
                </Button>
              </>
            )
            : undefined}
        />
      )}
      nav={viewNav}
      params={{
        podcastSlug,
      }}
      navAriaLabel="Podcast sections"
    />
  );
}
