import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { useWebsiteLookup } from "../hooks/useWebsites";
import type { YouTubeChannelHint } from "@eesimple/types";

import { WebsiteLookupBanner } from "./WebsiteLookupBanner";

type WebsiteLookupResult = ReturnType<typeof useWebsiteLookup>;

export interface RevealedWebsiteBannerProps {
  form: BookmarkFormApi;
  websiteLookup: WebsiteLookupResult;
  youtubeChannel: YouTubeChannelHint | null;
  onChannelSelfIdsChange: (ids: string[]) => void;
  websiteSiteName: string;
  onSiteNameChange: (name: string) => void;
  onSiteNameBlur: () => void;
  isNewChannel: boolean;
  setWebsiteCategory: boolean;
  setWebsiteTags: boolean;
  setChannelCategory: boolean;
  setChannelTags: boolean;
  onSetWebsiteCategory: (v: boolean) => void;
  onSetWebsiteTags: (v: boolean) => void;
  onSetChannelCategory: (v: boolean) => void;
  onSetChannelTags: (v: boolean) => void;
}

/** Left column: site / shortener info derived from the URL (website + YouTube channel banner). */
export function RevealedWebsiteBanner({
  form,
  websiteLookup,
  youtubeChannel,
  onChannelSelfIdsChange,
  websiteSiteName,
  onSiteNameChange,
  onSiteNameBlur,
  isNewChannel,
  setWebsiteCategory,
  setWebsiteTags,
  setChannelCategory,
  setChannelTags,
  onSetWebsiteCategory,
  onSetWebsiteTags,
  onSetChannelCategory,
  onSetChannelTags,
}: RevealedWebsiteBannerProps) {
  return (
    <div className="flex flex-col gap-4">
      <form.Subscribe
        selector={s => ({
          categoryId: s.values.categoryId,
          tagIds: s.values.tagIds,
        })}
      >
        {({
          categoryId,
          tagIds,
        }) => (
          <WebsiteLookupBanner
            data={websiteLookup.data}
            isYouTube={websiteLookup.data?.domain === "youtube.com"}
            youtubeChannel={youtubeChannel}
            onChannelSelfIdsChange={onChannelSelfIdsChange}
            websiteSiteName={websiteSiteName}
            onSiteNameChange={onSiteNameChange}
            onSiteNameBlur={onSiteNameBlur}
            categoryId={categoryId ?? ""}
            tagIds={tagIds ?? []}
            isNewChannel={isNewChannel}
            setWebsiteCategory={setWebsiteCategory}
            setWebsiteTags={setWebsiteTags}
            setChannelCategory={setChannelCategory}
            setChannelTags={setChannelTags}
            onSetWebsiteCategory={onSetWebsiteCategory}
            onSetWebsiteTags={onSetWebsiteTags}
            onSetChannelCategory={onSetChannelCategory}
            onSetChannelTags={onSetChannelTags}
          />
        )}
      </form.Subscribe>
    </div>
  );
}
