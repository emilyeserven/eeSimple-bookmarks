import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout, navLinkClass } from "../components/TabbedEntityLayout";
import { useYouTubeChannelBySlug } from "../hooks/useYouTubeChannels";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/edit")({
  component: YouTubeChannelEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/youtube-channels/$channelSlug/edit/general",
    label: "General",
  },
] as const;

function YouTubeChannelEditLayout() {
  const {
    channelSlug,
  } = Route.useParams();
  const {
    channel, isLoading,
  } = useYouTubeChannelBySlug(channelSlug);

  return (
    <TabbedEntityLayout
      header={(
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
            ← Back to {isLoading ? "channel" : (channel?.name ?? "channel")}
          </Link>
          <h1 className="text-2xl font-bold">Edit channel</h1>
        </div>
      )}
      nav={(
        <nav
          className="
            flex shrink-0 flex-col gap-1
            sm:w-48
          "
          aria-label="Channel edit sections"
        >
          {editNav.map(item => (
            <Link
              key={item.to}
              to={item.to}
              params={{
                channelSlug,
              }}
              className={cn(navLinkClass)}
              activeProps={{
                className: "bg-accent text-accent-foreground",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    />
  );
}
