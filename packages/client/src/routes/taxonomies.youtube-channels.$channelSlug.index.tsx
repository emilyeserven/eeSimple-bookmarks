import { Link, createFileRoute } from "@tanstack/react-router";

import { TaxonomyDetailLayout } from "../components/TaxonomyDetailLayout";
import { YouTubeChannelCard } from "../components/YouTubeChannelManager";
import { useDeleteYouTubeChannel, useYouTubeChannelBySlug } from "../hooks/useYouTubeChannels";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/")({
  component: YouTubeChannelViewPage,
});

function YouTubeChannelViewPage() {
  const {
    channelSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    channel, isLoading, error,
  } = useYouTubeChannelBySlug(channelSlug);
  const deleteChannel = useDeleteYouTubeChannel();

  return (
    <TaxonomyDetailLayout
      isLoading={isLoading}
      error={error}
      entity={channel}
      loadingLabel="Loading channel…"
      notFoundMessage="Channel not found."
      listHref="/taxonomies/youtube-channels"
      listLabel="Back to channels"
    >
      {ch => (
        <section className="space-y-4">
          <Link
            to="/taxonomies/youtube-channels"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to channels
          </Link>
          <YouTubeChannelCard channel={ch} />
          <div className="border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="
                text-destructive
                hover:text-destructive
              "
              disabled={deleteChannel.isPending}
              onClick={() =>
                deleteChannel.mutate(ch.id, {
                  onSuccess: () => navigate({
                    to: "/taxonomies/youtube-channels",
                  }),
                })}
            >
              {deleteChannel.isPending ? "Deleting…" : "Delete channel"}
            </Button>
          </div>
        </section>
      )}
    </TaxonomyDetailLayout>
  );
}
