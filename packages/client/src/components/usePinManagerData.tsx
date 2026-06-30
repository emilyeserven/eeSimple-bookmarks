import type { PinnedSidebarEntityType, PinnedSidebarItem } from "@eesimple/types";

import { Filter, Globe, MonitorPlay, Tags } from "lucide-react";

import { useCategories } from "../hooks/useCategories";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useAddPinnedSidebarItem, usePinnedSidebarItems, useRemovePinnedSidebarItem } from "../hooks/usePinnedSidebarItems";
import { useSavedFilters } from "../hooks/useSavedFilters";
import { useTags } from "../hooks/useTags";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";

import { CategoryIcon } from "@/lib/icons";

/** The `entityType:entityId` key used to identify a pin across the combobox and the pins list. */
function pinKey(entityType: PinnedSidebarEntityType, entityId: string): string {
  return `${entityType}:${entityId}`;
}

/**
 * Loads every pinnable entity, the current pins, and the add/remove mutations, then derives the
 * combobox options (excluding already-pinned items) and a label resolver. Shared state for
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
    data: allTags = [],
  } = useTags();
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

  const pinnedKeys = new Set(pins.map((p: PinnedSidebarItem) => pinKey(p.entityType, p.entityId)));

  const options = [
    ...categories
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
      })),
    ...allTags
      .filter(t => !pinnedKeys.has(pinKey("tag", t.id)))
      .map(t => ({
        value: pinKey("tag", t.id),
        label: t.name,
        icon: <Tags className="size-4 shrink-0" />,
      })),
    ...allWebsites
      .filter(w => !pinnedKeys.has(pinKey("website", w.id)))
      .map(w => ({
        value: pinKey("website", w.id),
        label: w.siteName,
        icon: <Globe className="size-4 shrink-0" />,
      })),
    ...allMediaTypes
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
      })),
    ...allChannels
      .filter(c => !pinnedKeys.has(pinKey("youtube-channel", c.id)))
      .map(c => ({
        value: pinKey("youtube-channel", c.id),
        label: c.name,
        icon: <MonitorPlay className="size-4 shrink-0" />,
      })),
    ...savedFilters
      .filter(f => !pinnedKeys.has(pinKey("saved-filter", f.id)))
      .map(f => ({
        value: pinKey("saved-filter", f.id),
        label: f.name,
        icon: <Filter className="size-4 shrink-0" />,
      })),
  ];

  function resolvePinLabel(pin: PinnedSidebarItem): string | null {
    if (pin.entityType === "category") return categories.find(c => c.id === pin.entityId)?.name ?? null;
    if (pin.entityType === "tag") return allTags.find(t => t.id === pin.entityId)?.name ?? null;
    if (pin.entityType === "website") return allWebsites.find(w => w.id === pin.entityId)?.siteName ?? null;
    if (pin.entityType === "media-type") return allMediaTypes.find(m => m.id === pin.entityId)?.name ?? null;
    if (pin.entityType === "youtube-channel") return allChannels.find(c => c.id === pin.entityId)?.name ?? null;
    if (pin.entityType === "saved-filter") return savedFilters.find(f => f.id === pin.entityId)?.name ?? null;
    return null;
  }

  return {
    pins,
    addPin,
    removePin,
    options,
    resolvePinLabel,
  };
}
