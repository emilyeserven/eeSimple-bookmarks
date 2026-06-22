import type { PinnedSidebarEntityType } from "@eesimple/types";

import { useState } from "react";

import { ChevronDown, Pin, PinOff } from "lucide-react";

import { PinManager } from "./PinManager";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePinToggle } from "@/hooks/usePinToggle";

/** The pinnable entity for the page the header is currently on. */
export interface PinContext {
  entityType: PinnedSidebarEntityType;
  entityId: string;
  label?: string;
}

/**
 * Header toolbar control for pinning. The main button is a context-aware toggle that pins/unpins the
 * current page's entity ({@link PinContext}); an adjacent caret opens a popover with the full
 * {@link PinManager} to pin or unpin anything. Rendered only when the current page has a pinnable
 * entity (the header gates on a non-null context).
 */
export function HeaderPinButton({
  context,
}: {
  context: PinContext;
}) {
  const [open, setOpen] = useState(false);
  const {
    isPinned, name, toggle,
  } = usePinToggle(context);

  return (
    <div className="flex items-center">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={isPinned ? `Unpin ${name}` : `Pin ${name}`}
        aria-pressed={isPinned}
        onClick={toggle}
      >
        {isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
      </Button>
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            aria-label="Manage pinned items"
          >
            <ChevronDown className="size-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-80"
        >
          <PinManager />
        </PopoverContent>
      </Popover>
    </div>
  );
}
