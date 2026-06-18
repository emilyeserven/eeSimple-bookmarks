import { Link, createFileRoute } from "@tanstack/react-router";

import { YouTubeChannelRow } from "../components/YouTubeChannelManager";
import { useYouTubeChannelBySlug } from "../hooks/useYouTubeChannels";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/edit")({
  component: YouTubeChannelEditPage,
});

function YouTubeChannelEditPage() {
  const {
    channelSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    channel, isLoading, error,
  } = useYouTubeChannelBySlug(channelSlug);

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
    <section className="space-y-6">
      <div className="space-y-1">
        <Link
          to="/taxonomies/youtube-channels/$channelSlug"
          params={{
            channelSlug,
          }}
          className="
            text-sm text-muted-foreground
            hover:text-foreground
          "
        >
          ← Back to {channel.name}
        </Link>
        <h1 className="text-2xl font-bold">Edit channel</h1>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <YouTubeChannelRow
          channel={channel}
          onSaved={() => navigate({
            to: "/taxonomies/youtube-channels",
          })}
        />
      </div>
    </section>
  );
}
