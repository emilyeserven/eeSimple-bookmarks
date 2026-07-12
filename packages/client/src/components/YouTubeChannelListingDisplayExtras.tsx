import { useTranslation } from "react-i18next";

import { PruneEmptyButton } from "./PruneEmptyButton";

import { useBulkDeleteYouTubeChannels, useYouTubeChannels } from "@/hooks/useYouTubeChannels";

/**
 * The YouTube Channels listing's Prune-empty control, rendered in the display-options box
 * (config `renderDisplayRowExtra`), beside the shared Multiselect toggle — mirrors
 * `WebsiteListingDisplayExtras`.
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
    <PruneEmptyButton
      ids={emptyIds}
      isPending={bulkDelete.isPending}
      onPrune={(ids, cb) => bulkDelete.mutate(ids, cb)}
      noun={[t("channel"), t("channels")]}
    />
  );
}
