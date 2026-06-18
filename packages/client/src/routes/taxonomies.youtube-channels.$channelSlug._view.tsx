import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteYouTubeChannel, useYouTubeChannelBySlug } from "../hooks/useYouTubeChannels";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/_view")({
  component: YouTubeChannelViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/youtube-channels/$channelSlug/general",
    label: "General",
  },
] as const;

function YouTubeChannelViewLayout() {
  const {
    channelSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    channel, isLoading,
  } = useYouTubeChannelBySlug(channelSlug);
  const deleteChannel = useDeleteYouTubeChannel();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/youtube-channels"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to channels
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="text-2xl font-bold">
                {isLoading ? "Channel" : (channel?.name ?? "Channel not found")}
              </h1>
              {channel
                ? (
                  <p className="text-sm text-muted-foreground">{channel.channelKey}</p>
                )
                : null}
            </div>
            {channel
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to="/taxonomies/youtube-channels/$channelSlug/edit/general"
                      params={{
                        channelSlug,
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
                    disabled={deleteChannel.isPending}
                    onClick={() => deleteChannel.mutate(channel.id, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/youtube-channels",
                      }),
                    })}
                  >
                    {deleteChannel.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        channelSlug,
      }}
      navAriaLabel="Channel sections"
    />
  );
}
