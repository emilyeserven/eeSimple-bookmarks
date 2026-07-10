import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";

import { useCategories } from "@/hooks/useCategories";
import { iconComboboxOptions } from "@/lib/comboboxOptions";
import { useUiStore } from "@/stores/uiStore";

/**
 * The YouTube Channels listing's category filter, rendered in the `ListingSearchBox` sort slot
 * (config `renderSearchSort`) — mirrors `WebsiteListingControls`. The combobox writes
 * `uiStore.youtubeChannelCategoryFilter` (consumed by `useYouTubeChannelFacetFilter`). The
 * Prune-empty + Multiselect controls render separately, in `YouTubeChannelListingDisplayExtras`.
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
    </div>
  );
}
