import { Link, createFileRoute, useRouterState } from "@tanstack/react-router";

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
  {
    to: "/taxonomies/youtube-channels/$channelSlug/autofill",
    label: "Autofill",
  },
  {
    to: "/taxonomies/youtube-channels/$channelSlug/display-rules",
    label: "Display Rules",
  },
] as const;

const VIEW_TO_EDIT = {
  "general": "/taxonomies/youtube-channels/$channelSlug/edit/general",
  "autofill": "/taxonomies/youtube-channels/$channelSlug/edit/autofill",
  "display-rules": "/taxonomies/youtube-channels/$channelSlug/edit/display-rules",
} as const;
type ChannelEditRoute = typeof VIEW_TO_EDIT[keyof typeof VIEW_TO_EDIT];

function YouTubeChannelViewLayout() {
  const {
    channelSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const pathname = useRouterState({
    select: s => s.location.pathname,
  });
  const editRoute: ChannelEditRoute = (VIEW_TO_EDIT[pathname.split("/").at(-1) as keyof typeof VIEW_TO_EDIT] ?? VIEW_TO_EDIT.general) as ChannelEditRoute;
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
                      to={editRoute}
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
