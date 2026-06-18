import { Link, createFileRoute } from "@tanstack/react-router";

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

  if (isLoading) {
    return <p className="text-muted-foreground">Loading channel…</p>;
  }

  if (error || !channel) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error?.message ?? "Channel not found."}</p>
        <Link
          to="/taxonomies/youtube-channels"
          className="
            text-sm text-muted-foreground
            hover:text-foreground
          "
        >
          ← Back to channels
        </Link>
      </div>
    );
  }

  return (
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
      <YouTubeChannelCard channel={channel} />
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
            deleteChannel.mutate(channel.id, {
              onSuccess: () => navigate({
                to: "/taxonomies/youtube-channels",
              }),
            })}
        >
          {deleteChannel.isPending ? "Deleting…" : "Delete channel"}
        </Button>
      </div>
    </section>
  );
}
