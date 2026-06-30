import type { ComboboxGroup } from "./Combobox";
import type { PinnedSidebarEntityType, PinnedSidebarItem } from "@eesimple/types";

import { useMemo } from "react";

import {
  Building2,
  Clapperboard,
  FileInput,
  Filter,
  FolderOpen,
  Globe,
  LayoutGrid,
  Layers,
  ListFilter,
  Mail,
  MapPin,
  MonitorPlay,
  Share2,
  SlidersHorizontal,
  Tags,
  UserRound,
  Wand2,
} from "lucide-react";

import { useCategories } from "../hooks/useCategories";
import { useLocationTree } from "../hooks/useLocations";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useAddPinnedSidebarItem, usePinnedSidebarItems, useRemovePinnedSidebarItem } from "../hooks/usePinnedSidebarItems";
import { useSavedFilters } from "../hooks/useSavedFilters";
import { useTagTree } from "../hooks/useTags";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { flattenTree } from "../lib/tagTree";

import { CategoryIcon } from "@/lib/icons";

/** The `entityType:entityId` key used to identify a pin across the combobox and the pins list. */
function pinKey(entityType: PinnedSidebarEntityType, entityId: string): string {
  return `${entityType}:${entityId}`;
}

/** A taxonomy listing page entry that can be pinned as a quick-access sidebar link. */
export interface TaxonomyListingPin {
  key: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  path: string;
}

/**
 * Static registry of taxonomy listing pages that can be pinned. `key` becomes the `entityId` for
 * `taxonomy-listing` pins; `path` is the route the pin links to.
 */
export const TAXONOMY_LISTING_PINS: TaxonomyListingPin[] = [
  {
    key: "categories",
    label: "Categories",
    Icon: FolderOpen,
    path: "/categories",
  },
  {
    key: "tags",
    label: "Tags",
    Icon: Tags,
    path: "/tags",
  },
  {
    key: "locations",
    label: "Locations",
    Icon: MapPin,
    path: "/taxonomies/locations",
  },
  {
    key: "websites",
    label: "Websites",
    Icon: Globe,
    path: "/taxonomies/websites",
  },
  {
    key: "media-types",
    label: "Media Types",
    Icon: Clapperboard,
    path: "/taxonomies/media-types",
  },
  {
    key: "youtube-channels",
    label: "YouTube Channels",
    Icon: MonitorPlay,
    path: "/taxonomies/youtube-channels",
  },
  {
    key: "authors",
    label: "Authors",
    Icon: UserRound,
    path: "/taxonomies/authors",
  },
  {
    key: "publishers",
    label: "Publishers",
    Icon: Building2,
    path: "/taxonomies/publishers",
  },
  {
    key: "newsletters",
    label: "Imports",
    Icon: Mail,
    path: "/taxonomies/newsletters",
  },
  {
    key: "custom-properties",
    label: "Custom Properties",
    Icon: SlidersHorizontal,
    path: "/custom-properties",
  },
  {
    key: "property-groups",
    label: "Property Groups",
    Icon: Layers,
    path: "/taxonomies/property-groups",
  },
  {
    key: "relationship-types",
    label: "Relationship Types",
    Icon: Share2,
    path: "/taxonomies/relationship-types",
  },
  {
    key: "autofill",
    label: "Autofill Rules",
    Icon: Wand2,
    path: "/autofill",
  },
  {
    key: "saved-filters",
    label: "Saved Filters",
    Icon: ListFilter,
    path: "/saved-filters",
  },
  {
    key: "card-display-rules",
    label: "Card Display Rules",
    Icon: LayoutGrid,
    path: "/card-display-rules",
  },
  {
    key: "import-rules",
    label: "Import Rules",
    Icon: FileInput,
    path: "/import-rules",
  },
];

/**
 * Loads every pinnable entity, the current pins, and the add/remove mutations, then derives the
 * grouped combobox options (excluding already-pinned items) and a label resolver. Shared state for
 * {@link PinManager}.
 */
export function usePinManagerData() {
  const {
    data: pins = [],
  } = usePinnedSidebarItems();
  const addPin = useAddPinnedSidebarItem();
  const removePin = useRemovePinnedSidebarItem();

  const {
    data: categories = [],
  } = useCategories();
  const {
    data: tagTree = [],
  } = useTagTree();
  const {
    data: locationTree = [],
  } = useLocationTree();
  const {
    data: allWebsites = [],
  } = useWebsites();
  const {
    data: allMediaTypes = [],
  } = useMediaTypes();
  const {
    data: allChannels = [],
  } = useYouTubeChannels();
  const {
    data: savedFilters = [],
  } = useSavedFilters();

  const pinnedKeys = useMemo(
    () => new Set(pins.map((p: PinnedSidebarItem) => pinKey(p.entityType, p.entityId))),
    [pins],
  );
  const flatTags = useMemo(() => flattenTree(tagTree), [tagTree]);
  const flatLocations = useMemo(() => flattenTree(locationTree), [locationTree]);

  const groups = useMemo((): ComboboxGroup[] => {
    const listingOptions = TAXONOMY_LISTING_PINS
      .filter(l => !pinnedKeys.has(pinKey("taxonomy-listing", l.key)))
      .map(l => ({
        value: pinKey("taxonomy-listing", l.key),
        label: l.label,
        icon: <l.Icon className="size-4 shrink-0" />,
      }));

    const categoryOptions = categories
      .filter(c => !pinnedKeys.has(pinKey("category", c.id)))
      .map(c => ({
        value: pinKey("category", c.id),
        label: c.name,
        icon: (
          <CategoryIcon
            name={c.icon}
            className="size-4 shrink-0"
          />
        ),
      }));

    const locationOptions = flatLocations
      .filter(fl => !pinnedKeys.has(pinKey("location", fl.node.id)))
      .map(fl => ({
        value: pinKey("location", fl.node.id),
        label: fl.node.name,
        romanized: fl.node.romanizedName,
        depth: fl.depth,
        icon: <MapPin className="size-4 shrink-0" />,
      }));

    const tagOptions = flatTags
      .filter(ft => !pinnedKeys.has(pinKey("tag", ft.node.id)))
      .map(ft => ({
        value: pinKey("tag", ft.node.id),
        label: ft.node.name,
        romanized: ft.node.romanizedName,
        depth: ft.depth,
        icon: <Tags className="size-4 shrink-0" />,
      }));

    const websiteOptions = allWebsites
      .filter(w => !pinnedKeys.has(pinKey("website", w.id)))
      .map(w => ({
        value: pinKey("website", w.id),
        label: w.siteName,
        icon: <Globe className="size-4 shrink-0" />,
      }));

    const mediaTypeOptions = allMediaTypes
      .filter(m => !pinnedKeys.has(pinKey("media-type", m.id)))
      .map(m => ({
        value: pinKey("media-type", m.id),
        label: m.name,
        icon: (
          <CategoryIcon
            name={m.icon}
            className="size-4 shrink-0"
          />
        ),
      }));

    const channelOptions = allChannels
      .filter(c => !pinnedKeys.has(pinKey("youtube-channel", c.id)))
      .map(c => ({
        value: pinKey("youtube-channel", c.id),
        label: c.name,
        icon: <MonitorPlay className="size-4 shrink-0" />,
      }));

    const savedFilterOptions = savedFilters
      .filter(f => !pinnedKeys.has(pinKey("saved-filter", f.id)))
      .map(f => ({
        value: pinKey("saved-filter", f.id),
        label: f.name,
        icon: <Filter className="size-4 shrink-0" />,
      }));

    return [
      {
        heading: "Listing Pages",
        options: listingOptions,
      },
      {
        heading: "Categories",
        options: categoryOptions,
      },
      {
        heading: "Locations",
        options: locationOptions,
      },
      {
        heading: "Tags",
        options: tagOptions,
      },
      {
        heading: "Websites",
        options: websiteOptions,
      },
      {
        heading: "Media Types",
        options: mediaTypeOptions,
      },
      {
        heading: "YouTube Channels",
        options: channelOptions,
      },
      {
        heading: "Saved Filters",
        options: savedFilterOptions,
      },
    ].filter(g => g.options.length > 0);
  }, [pinnedKeys, categories, flatTags, flatLocations, allWebsites, allMediaTypes, allChannels, savedFilters]);

  function resolvePinLabel(pin: PinnedSidebarItem): string | null {
    if (pin.entityType === "category") return categories.find(c => c.id === pin.entityId)?.name ?? null;
    if (pin.entityType === "tag") return flatTags.find(ft => ft.node.id === pin.entityId)?.node.name ?? null;
    if (pin.entityType === "website") return allWebsites.find(w => w.id === pin.entityId)?.siteName ?? null;
    if (pin.entityType === "media-type") return allMediaTypes.find(m => m.id === pin.entityId)?.name ?? null;
    if (pin.entityType === "youtube-channel") return allChannels.find(c => c.id === pin.entityId)?.name ?? null;
    if (pin.entityType === "saved-filter") return savedFilters.find(f => f.id === pin.entityId)?.name ?? null;
    if (pin.entityType === "location") return flatLocations.find(fl => fl.node.id === pin.entityId)?.node.name ?? null;
    if (pin.entityType === "taxonomy-listing") return TAXONOMY_LISTING_PINS.find(l => l.key === pin.entityId)?.label ?? null;
    return null;
  }

  return {
    pins,
    addPin,
    removePin,
    groups,
    resolvePinLabel,
  };
}
