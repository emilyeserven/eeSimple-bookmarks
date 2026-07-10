import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import { PruneEmptyButton } from "./PruneEmptyButton";

import { useCategories } from "@/hooks/useCategories";
import { useBulkDeleteYouTubeChannels, useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { iconComboboxOptions } from "@/lib/comboboxOptions";
import { useUiStore } from "@/stores/uiStore";

/**
 * The YouTube Channels listing's category filter + Prune button, rendered in the `ListingSearchBox`
 * sort slot (config `renderSearchSort`) — mirrors `WebsiteListingControls`. The combobox writes
 * `uiStore.youtubeChannelCategoryFilter` (consumed by `useYouTubeChannelFacetFilter`).
 */
export function YouTubeChannelListingControls() {
  const {
    t,
  } = useTranslation();

  const category = useUiStore(s => s.youtubeChannelCategoryFilter);
  const setCategory = useUiStore(s => s.setYoutubeChannelCategoryFilter);

  const {
    data: categories,
  } = useCategories();
  const {
    data: channels,
  } = useYouTubeChannels();
  const bulkDelete = useBulkDeleteYouTubeChannels();
  const emptyIds = (channels ?? [])
    .filter(channel => (channel.bookmarkCount ?? 0) === 0)
    .map(channel => channel.id);

  return (
    <div className="flex items-center gap-2">
      <Combobox
        options={iconComboboxOptions(categories ?? [])}
        value={category ?? undefined}
        onValueChange={value => setCategory(value ?? null)}
        placeholder={t("Filter by category…")}
        searchPlaceholder={t("Search categories…")}
        className="max-w-sm"
        aria-label={t("Filter channels by category")}
      />

      <PruneEmptyButton
        ids={emptyIds}
        isPending={bulkDelete.isPending}
        onPrune={(ids, cb) => bulkDelete.mutate(ids, cb)}
        noun={[t("channel"), t("channels")]}
      />
    </div>
  );
}
