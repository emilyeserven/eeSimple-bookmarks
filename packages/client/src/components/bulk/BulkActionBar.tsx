import type { ReactNode } from "react";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  /** Number of currently-selected items. The bar renders nothing when this is 0. */
  count: number;
  /** Total selectable items (excludes things like built-ins); powers the "Select all N" affordance. */
  totalSelectable: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  /** The bulk action controls (delete, set category, …) rendered on the trailing edge. */
  children?: ReactNode;
}

/**
 * Contextual action bar shown above a listing when ≥1 item is selected. Displays the selection count,
 * a "Select all" shortcut, the action controls, and a Clear button. Shared by the Bookmarks page and
 * every taxonomy listing.
 */
export function BulkActionBar({
  count,
  totalSelectable,
  allSelected,
  onSelectAll,
  onClear,
  children,
}: BulkActionBarProps) {
  if (count === 0) return null;
  return (
    <div
      className="
        sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-md border
        bg-card p-2 shadow-sm
      "
    >
      <span className="text-sm font-medium">
        {count}
        {" selected"}
      </span>
      {!allSelected && totalSelectable > count
        ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
          >
            Select all
            {" "}
            {totalSelectable}
          </Button>
        )
        : null}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {children}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
        >
          <X className="size-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}
