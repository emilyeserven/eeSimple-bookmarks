import type { PinnedSidebarEntityType, PinnedSidebarItem } from "@eesimple/types";

import { useState } from "react";

import { X } from "lucide-react";

import { Combobox } from "./Combobox";
import { usePinManagerData } from "./usePinManagerData";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shared body for pin management: a combobox to pin any category / tag / website / media type /
 * YouTube channel / saved filter as a quick-access sidebar link, plus the list of current pins with
 * unpin buttons. Used both by the Settings `PinnedItemsCard` and the header `HeaderPinButton`
 * popover.
 */
export function PinManager() {
  const {
    pins, addPin, removePin, groups, resolvePinLabel,
  } = usePinManagerData();
  const [comboValue, setComboValue] = useState<string | undefined>();

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

  return (
    <div className="space-y-3">
      <Combobox
        groups={groups}
        value={comboValue}
        onValueChange={handleSelect}
        placeholder="Pin a category, location, tag…"
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
