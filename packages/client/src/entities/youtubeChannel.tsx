/* eslint-disable react-refresh/only-export-components -- this module pairs a small filter component with the entity's route/palette/listing config constants, not a component-only module */
import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { UpdateYouTubeChannelInput, YouTubeChannel } from "@eesimple/types";

import { Combobox } from "../components/Combobox";
import { youtubeChannelWorkbench } from "../components/workbench/youtubeChannel";
import { YouTubeChannelListItem } from "../components/YouTubeChannelListItem";
import { YouTubeChannelTable } from "../components/YouTubeChannelTable";
import { useBulkDeleteYouTubeChannels, useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { youtubeChannelsApi } from "../lib/api/taxonomies";
import { iconComboboxOptions } from "../lib/comboboxOptions";

import { useCategories } from "@/hooks/useCategories";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Hoisted so `entityRoutes.ts`'s `ENTITY_ROUTES` can reference this entry by identity. */
export const YOUTUBE_CHANNEL_ROUTE: EntityRoute = {
  kind: "youtube-channel",
  prefix: "/taxonomies/youtube-channels",
  slugIndex: 2,
  listLabel: "YouTube Channels",
  singular: "Channel",
  switcher: "youtube-channel",
  flatCrumbs: true,
};

/** Hoisted so `entityPaletteRegistry.ts`'s `ENTITY_PALETTE_CONFIGS` can reference this entry by identity. */
export const YOUTUBE_CHANNEL_PALETTE: EntityPaletteConfig = {
  queryKey: ["youtube-channels"],
  listFn: () => youtubeChannelsApi.list(),
  updateFn: (id, patch) => youtubeChannelsApi.update(id, patch as UpdateYouTubeChannelInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
  fields: [
    {
      type: "choice",
      key: "categoryId",
      label: "Category",
      options: "categories",
      getValue: entity => (entity as YouTubeChannel).category?.id ?? null,
    },
    {
      type: "choice",
      key: "mediaTypeId",
      label: "Default Media Type",
      options: "media-types",
      getValue: entity => (entity as YouTubeChannel).mediaTypeId ?? null,
    },
  ],
};

/** The category-filter combobox shown above the YouTube channels listing, reproducing the pre-scaffold filter UI. */
function CategoryFilterCombobox({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const {
    data: categories,
  } = useCategories();
  const categoryOptions = iconComboboxOptions(categories ?? []);

  return (
    <Combobox
      options={categoryOptions}
      value={value ?? undefined}
      onValueChange={next => onChange(next ?? null)}
      placeholder="Filter by category…"
      searchPlaceholder="Search categories…"
      className="max-w-sm"
      aria-label="Filter channels by category"
    />
  );
}

export const youtubeChannelListingConfig: EntityListingConfig<YouTubeChannel> = {
  pageKey: "youtube-channels-listing",
  useItems: useYouTubeChannels,
  matches: (channel, query) =>
    channel.name.toLowerCase().includes(query) || channel.channelKey.toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteYouTubeChannels,
  noun: ["channel", "channels"],
  secondaryFilter: {
    render: ({
      value, onChange,
    }) => (
      <CategoryFilterCombobox
        value={value}
        onChange={onChange}
      />
    ),
    matches: (channel, categoryId) => !categoryId || channel.category?.id === categoryId,
  },
  loadingLabel: "Loading channels…",
  entityPlural: "channels",
  emptyMessage: (
    <p className="text-muted-foreground">
      No channels yet. Add one above or they&apos;re created automatically when you add YouTube bookmarks.
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <YouTubeChannelListItem
      channel={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <YouTubeChannelTable
      channels={entities}
      selection={selection}
    />
  ),
};

/** Eighth `EntityDescriptor` migration (after Publisher #868, Person #872, PropertyGroup #873, Newsletter #874, RelationshipType + SavedFilter #875, Website #880) — issue #860. */
export const youtubeChannelDescriptor: EntityDescriptor<YouTubeChannel> = {
  kind: "youtube-channel",
  route: YOUTUBE_CHANNEL_ROUTE,
  palette: YOUTUBE_CHANNEL_PALETTE,
  workbench: youtubeChannelWorkbench,
  listing: youtubeChannelListingConfig,
};
