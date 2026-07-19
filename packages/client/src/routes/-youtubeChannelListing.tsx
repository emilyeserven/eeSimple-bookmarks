import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useYouTubeChannelBySlug } from "../hooks/useYouTubeChannels";

interface Props {
  channelSlug: string;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery/media). */
  activeView: "bookmarks" | "gallery";
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * The channel-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` / `_hub.media`
 * routes (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub` layout, so this
 * passes none to `BookmarkSearchView`.
 */
export function YouTubeChannelListing({
  channelSlug, activeView, search, onSearchChange,
}: Props) {
  const {
    t,
  } = useTranslation();

  const {
    categories,
    properties,
    tagTree,
    mediaTypes,
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
  } = useCategoryPageData();

  const {
    channel, isLoading: channelLoading,
  } = useYouTubeChannelBySlug(channelSlug);

  if (channelLoading) {
    return <p className="text-muted-foreground">{t("Loading channel…")}</p>;
  }

  if (!channel) {
    return <p className="text-destructive">{t("Channel not found.")}</p>;
  }

  return (
    <BookmarkSearchView
      activeView={activeView}
      pageKey={`channel:${channelSlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      categories={categories ?? []}
      mediaTypes={mediaTypes ?? []}
      relationshipTypes={relationshipTypes ?? []}
      people={people ?? []}
      placeTypes={placeTypes ?? []}
      genreMoods={genreMoods ?? []}
      scope={{
        kind: "youtubeChannel",
        id: channel.id,
      }}
      search={search}
      onSearchChange={onSearchChange}
      emptyMessage={t("No bookmarks for this channel yet.")}
      noMatchMessage={t("No bookmarks for this channel match these filters.")}
    />
  );
}
