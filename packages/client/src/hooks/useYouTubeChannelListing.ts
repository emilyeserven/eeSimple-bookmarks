import type { YouTubeChannel } from "@eesimple/types";

import { useUiStore } from "../stores/uiStore";

/**
 * The YouTube Channels listing's category facet-filter hook, consumed by
 * `youtubeChannelListingConfig`'s `useExtraFilter` slot. Kept out of
 * `YouTubeChannelListingControls.tsx` so that file stays component-only (fast-refresh). The control
 * component writes the same `uiStore.youtubeChannelCategoryFilter` pref this reads — mirrors
 * `useWebsiteFacetFilter`.
 */
export function useYouTubeChannelFacetFilter(items: YouTubeChannel[]): YouTubeChannel[] {
  const category = useUiStore(s => s.youtubeChannelCategoryFilter);
  return items.filter(channel => !category || channel.category?.id === category);
}
