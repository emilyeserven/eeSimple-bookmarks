import { Filter } from "lucide-react";

import { FilterLocationControls } from "./FilterLocationControls";

import { Button } from "@/components/ui/button";
import { ResponsivePopover } from "@/components/ui/responsive-popover";

/**
 * Header control for choosing where the filter panel appears (sidebar / drawer / hide). A popover on
 * desktop, a modal on small screens — both render the shared {@link FilterLocationControls}.
 */
export function FilterLocationPopover({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  return (
    <ResponsivePopover
      title="Filters"
      open={open}
      onOpenChange={onOpenChange}
      trigger={(
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Filters"
        >
          <Filter className="size-4" />
        </Button>
      )}
    >
      <FilterLocationControls />
    </ResponsivePopover>
  );
}
