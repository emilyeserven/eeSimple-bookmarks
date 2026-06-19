import { createFileRoute } from "@tanstack/react-router";
import { MonitorPlay } from "lucide-react";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useYouTubeChannelBySlug } from "../hooks/useYouTubeChannels";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/")({
  validateSearch: validateBookmarkSearch,
  component: YouTubeChannelBookmarksPage,
});

function YouTubeChannelBookmarksPage() {
  const {
    channelSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    categories,
    properties,
    propertyGroups,
    bookmarks,
    bookmarksLoading,
    error,
    tagTree,
    mediaTypes,
  } = useCategoryPageData(search.tags);

  const {
    channel, isLoading: channelLoading,
  } = useYouTubeChannelBySlug(channelSlug);

  if (channelLoading) {
    return <p className="text-muted-foreground">Loading channel…</p>;
  }

  if (!channel) {
    return <p className="text-destructive">Channel not found.</p>;
  }

  const channelBookmarks = (bookmarks ?? []).filter(b => b.youtubeChannel?.id === channel.id);

  return (
    <BookmarkSearchView
      header={(
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <MonitorPlay className="size-6 shrink-0" />
            {channel.name}
          </h1>
          {channel.channelKey
            ? <p className="text-sm text-muted-foreground">{channel.channelKey}</p>
            : null}
        </div>
      )}
      pageKey={`channel:${channelSlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      propertyGroups={propertyGroups ?? []}
      categories={categories ?? []}
      mediaTypes={mediaTypes ?? []}
      bookmarks={channelBookmarks}
      search={search}
      onSearchChange={next => navigate({
        search: next,
        replace: true,
      })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage="No bookmarks for this channel yet."
      noMatchMessage="No bookmarks for this channel match these filters."
    />
  );
}
