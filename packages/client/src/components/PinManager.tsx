import type { PinnedSidebarEntityType, PinnedSidebarItem } from "@eesimple/types";

import { useState } from "react";

import { Filter, Globe, MonitorPlay, Tags, X } from "lucide-react";

import { Combobox } from "./Combobox";
import { useCategories } from "../hooks/useCategories";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useAddPinnedSidebarItem, usePinnedSidebarItems, useRemovePinnedSidebarItem } from "../hooks/usePinnedSidebarItems";
import { useSavedFilters } from "../hooks/useSavedFilters";
import { useTags } from "../hooks/useTags";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";

import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** The `entityType:entityId` key used to identify a pin across the combobox and the pins list. */
function pinKey(entityType: PinnedSidebarEntityType, entityId: string): string {
  return `${entityType}:${entityId}`;
}

/**
 * Shared body for pin management: a combobox to pin any category / tag / website / media type /
 * YouTube channel / saved filter as a quick-access sidebar link, plus the list of current pins with
 * unpin buttons. Used both by the Settings `PinnedItemsCard` and the header `HeaderPinButton`
 * popover.
 */
export function PinManager() {
  const {
    data: pins = [],
  } = usePinnedSidebarItems();
  const addPin = useAddPinnedSidebarItem();
  const removePin = useRemovePinnedSidebarItem();
  const [comboValue, setComboValue] = useState<string | undefined>();

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

  function handleSelect(value: string | undefined) {
    if (!value) return;
    const colonIdx = value.indexOf(":");
    const entityType = value.slice(0, colonIdx) as PinnedSidebarEntityType;
    const entityId = value.slice(colonIdx + 1);
    addPin.mutate({
      entityType,
      entityId,
    });
    setComboValue(undefined);
  }

  function resolvePinLabel(pin: PinnedSidebarItem): string | null {
    if (pin.entityType === "category") return categories.find(c => c.id === pin.entityId)?.name ?? null;
    if (pin.entityType === "tag") return allTags.find(t => t.id === pin.entityId)?.name ?? null;
    if (pin.entityType === "website") return allWebsites.find(w => w.id === pin.entityId)?.siteName ?? null;
    if (pin.entityType === "media-type") return allMediaTypes.find(m => m.id === pin.entityId)?.name ?? null;
    if (pin.entityType === "youtube-channel") return allChannels.find(c => c.id === pin.entityId)?.name ?? null;
    if (pin.entityType === "saved-filter") return savedFilters.find(f => f.id === pin.entityId)?.name ?? null;
    return null;
  }

  return (
    <div className="space-y-3">
      <Combobox
        options={options}
        value={comboValue}
        onValueChange={handleSelect}
        placeholder="Pin a category, tag, website…"
        searchPlaceholder="Search…"
        emptyText="Nothing left to pin."
      />
      {pins.length > 0
        ? (
          <div className="space-y-1">
            {pins.map((pin: PinnedSidebarItem) => {
              const label = resolvePinLabel(pin);
              return (
                <div
                  key={pin.id}
                  className="flex items-center gap-2 py-0.5"
                >
                  <span
                    className={cn(
                      "flex-1 truncate text-sm",
                      !label && "text-muted-foreground italic",
                    )}
                  >
                    {label ?? "(deleted)"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0"
                    onClick={() => removePin.mutate(pin.id)}
                  >
                    <X className="size-3.5" />
                    <span className="sr-only">Unpin {label ?? "item"}</span>
                  </Button>
                </div>
              );
            })}
          </div>
        )
        : <p className="text-sm text-muted-foreground">No pinned items yet.</p>}
    </div>
  );
}
