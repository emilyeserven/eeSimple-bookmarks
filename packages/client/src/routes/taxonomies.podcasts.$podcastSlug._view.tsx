import { Link, createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeletePodcast, usePodcastBySlug } from "../hooks/usePodcasts";

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
        <div className="space-y-1">
          <Link
            to="/taxonomies/podcasts"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to podcasts
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading
                ? "Podcast"
                : podcast
                  ? (
                    <RomanizedLabel
                      name={podcast.name}
                      romanized={podcast.romanizedName}
                    />
                  )
                  : "Podcast not found"}
            </h1>
            {podcast
              ? (
                <div className="flex shrink-0 items-center gap-1">
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
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        podcastSlug,
      }}
      navAriaLabel="Podcast sections"
    />
  );
}
