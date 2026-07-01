import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AddYouTubeChannelModal } from "./AddYouTubeChannelModal";
import { Combobox } from "./Combobox";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { YouTubeChannelListBody } from "./YouTubeChannelListBody";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";

import { useCategories } from "@/hooks/useCategories";
import { iconComboboxOptions } from "@/lib/comboboxOptions";

/** Browsable, searchable channel listing with add modal. Shared by the YouTube Channels taxonomy page and the Settings page. */
export function YouTubeChannelsListing() {
  const {
    data: allChannels, isLoading, error,
  } = useYouTubeChannels();
  const {
    data: categories,
  } = useCategories();
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>();
  useSetListingPage("youtube-channels-listing", false, false, false, () => setModalOpen(true), false, {
    addBookmark: {},
    createLabel: "New channel",
  });
  useRegisterHeaderSearch();
  const navigate = useNavigate();

  const channels = allChannels ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    channels,
    (c, query) => c.name.toLowerCase().includes(query) || c.channelKey.toLowerCase().includes(query),
  );

  const categoryOptions = iconComboboxOptions(categories ?? []);
  const selectedCategory = categories?.find(category => category.id === categoryFilter);
  const categoryFiltered = categoryFilter
    ? filtered.filter(c => c.category?.id === categoryFilter)
    : filtered;
  const filterActive = hasQuery || Boolean(categoryFilter);

  return (
    <div className="space-y-4">
      <Combobox
        options={categoryOptions}
        value={categoryFilter}
        onValueChange={setCategoryFilter}
        placeholder="Filter by category…"
        searchPlaceholder="Search categories…"
        className="max-w-sm"
        aria-label="Filter channels by category"
      />

      <ListingStatusMessages
        isLoading={isLoading}
        error={error}
        totalCount={channels.length}
        filteredCount={categoryFiltered.length}
        rawQuery={hasQuery ? rawQuery : (selectedCategory?.name ?? "")}
        hasQuery={filterActive}
        loadingLabel="Loading channels…"
        entityPlural="channels"
        emptyMessage={(
          <p className="text-muted-foreground">
            No channels yet. Add one above or they&apos;re created automatically when you add YouTube bookmarks.
          </p>
        )}
      />

      <YouTubeChannelListBody filtered={categoryFiltered} />

      <AddYouTubeChannelModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(channel) => {
          void navigate({
            to: "/taxonomies/youtube-channels/$channelSlug/edit/general",
            params: {
              channelSlug: channel.slug,
            },
          });
        }}
      />
    </div>
  );
}
