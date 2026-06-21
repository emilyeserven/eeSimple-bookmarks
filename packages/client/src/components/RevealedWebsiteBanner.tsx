import type { useWebsiteLookup } from "../hooks/useWebsites";
import type { YouTubeChannelHint } from "@eesimple/types";

import { WebsiteLookupBanner } from "./WebsiteLookupBanner";

type WebsiteLookupResult = ReturnType<typeof useWebsiteLookup>;

export interface RevealedWebsiteBannerProps {
  websiteLookup: WebsiteLookupResult;
  youtubeChannel: YouTubeChannelHint | null;
  onChannelSelfIdsChange: (ids: string[]) => void;
  websiteSiteName: string;
  onSiteNameChange: (name: string) => void;
  onSiteNameBlur: () => void;
}

/** Left column: site / shortener info derived from the URL (website + YouTube channel banner). */
export function RevealedWebsiteBanner({
  websiteLookup,
  youtubeChannel,
  onChannelSelfIdsChange,
  websiteSiteName,
  onSiteNameChange,
  onSiteNameBlur,
}: RevealedWebsiteBannerProps) {
  return (
    <div className="flex flex-col gap-4">
      <WebsiteLookupBanner
        data={websiteLookup.data}
        isYouTube={websiteLookup.data?.domain === "youtube.com"}
        youtubeChannel={youtubeChannel}
        onChannelSelfIdsChange={onChannelSelfIdsChange}
        websiteSiteName={websiteSiteName}
        onSiteNameChange={onSiteNameChange}
        onSiteNameBlur={onSiteNameBlur}
      />
    </div>
  );
}
