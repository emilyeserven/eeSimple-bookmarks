import { useTranslation } from "react-i18next";

import { HeaderBulkSelectButton } from "./header/HeaderBulkSelectButton";
import { PruneEmptyButton } from "./PruneEmptyButton";

import { useBulkDeleteYouTubeChannels, useYouTubeChannels } from "@/hooks/useYouTubeChannels";

const YOUTUBE_CHANNELS_PAGE_KEY = "youtube-channels-listing";

/**
 * The YouTube Channels listing's Prune-empty + Multiselect-toggle controls, rendered in the same row
 * as `ListingDisplayControls` (config `renderDisplayRowExtra`), opposite it — mirrors
 * `WebsiteListingDisplayExtras`. The Multiselect toggle moves here instead of the header
 * (`youtubeChannelListingConfig.hideBulkSelectFromHeader`).
 */
export function YouTubeChannelListingDisplayExtras() {
  const {
    t,
  } = useTranslation();
  const {
    data: channels,
  } = useYouTubeChannels();
  const bulkDelete = useBulkDeleteYouTubeChannels();
  const emptyIds = (channels ?? [])
    .filter(channel => (channel.bookmarkCount ?? 0) === 0)
    .map(channel => channel.id);

  return (
    <div className="flex items-center gap-2">
      <PruneEmptyButton
        ids={emptyIds}
        isPending={bulkDelete.isPending}
        onPrune={(ids, cb) => bulkDelete.mutate(ids, cb)}
        noun={[t("channel"), t("channels")]}
      />
      <HeaderBulkSelectButton pageKey={YOUTUBE_CHANNELS_PAGE_KEY} />
    </div>
  );
}
