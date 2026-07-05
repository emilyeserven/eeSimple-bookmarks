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
import i18n from "../i18n";
import { youtubeChannelsApi } from "../lib/api/taxonomies";
import { iconComboboxOptions } from "../lib/comboboxOptions";

import { useCategories } from "@/hooks/useCategories";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const YOUTUBE_CHANNEL_ROUTE: EntityRoute = {
  kind: "youtube-channel",
  prefix: "/taxonomies/youtube-channels",
  slugIndex: 2,
  listLabel: i18n.t("YouTube Channels"),
  singular: i18n.t("Channel"),
  switcher: "youtube-channel",
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const YOUTUBE_CHANNEL_PALETTE: EntityPaletteConfig = {
  queryKey: ["youtube-channels"],
  listFn: () => youtubeChannelsApi.list(),
  updateFn: (id, patch) => youtubeChannelsApi.update(id, patch as UpdateYouTubeChannelInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
  fields: [
    {
      type: "choice",
      key: "categoryId",
      label: i18n.t("Category"),
      options: "categories",
      getValue: entity => (entity as YouTubeChannel).category?.id ?? null,
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
      placeholder={i18n.t("Filter by category…")}
      searchPlaceholder={i18n.t("Search categories…")}
      className="max-w-sm"
      aria-label={i18n.t("Filter channels by category")}
    />
  );
}

export const youtubeChannelListingConfig: EntityListingConfig<YouTubeChannel> = {
  pageKey: "youtube-channels-listing",
  useItems: useYouTubeChannels,
  matches: (channel, query) =>
    channel.name.toLowerCase().includes(query) || channel.channelKey.toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteYouTubeChannels,
  noun: [i18n.t("channel"), i18n.t("channels")],
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
  loadingLabel: i18n.t("Loading channels…"),
  entityPlural: i18n.t("channels"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No channels yet. Add one above or they're created automatically when you add YouTube bookmarks.")}
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

/** Eighth `EntityDescriptor` migration (after Group #868, Person #872, PropertyGroup #873, Newsletter #874, RelationshipType + SavedFilter #875, Website #880) — issue #860. */
export const youtubeChannelDescriptor: EntityDescriptor<YouTubeChannel> = {
  kind: "youtube-channel",
  route: YOUTUBE_CHANNEL_ROUTE,
  palette: YOUTUBE_CHANNEL_PALETTE,
  workbench: youtubeChannelWorkbench,
  listing: youtubeChannelListingConfig,
};
