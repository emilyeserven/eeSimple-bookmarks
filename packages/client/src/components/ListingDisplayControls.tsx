import type { ViewMode } from "../lib/bookmarkColumns";

import { COLUMN_OPTIONS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { useUiStore } from "../stores/uiStore";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ListingDisplayControlsProps {
  pageKey: string;
}

/**
 * The per-listing display controls that remain page-level: the card/table view toggle and the grid
 * column count. Everything else about how a bookmark card looks (field visibility, image
 * presentation) is governed by Card Display Rules (Settings → Card Display Rules), not per page.
 */
export function ListingDisplayControls({
  pageKey,
}: ListingDisplayControlsProps) {
  const viewMode = useViewMode(pageKey);
  const setViewMode = useUiStore(state => state.setViewMode);
  const columns = useBookmarkColumns(pageKey);
  const setBookmarkColumns = useUiStore(state => state.setBookmarkColumns);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-4">
        <Label className="text-sm font-medium">View</Label>
        <ToggleGroup
          type="single"
          size="sm"
          value={viewMode}
          className="gap-0 overflow-hidden rounded-md border border-input"
          onValueChange={(next) => {
            if (next) setViewMode(pageKey, next as ViewMode);
          }}
        >
          <ToggleGroupItem
            value="cards"
            className="
              rounded-none border-r border-input
              first:rounded-l-sm
            "
          >
            Cards
          </ToggleGroupItem>
          <ToggleGroupItem
            value="table"
            className="
              rounded-none
              last:rounded-r-sm
            "
          >
            Table
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {viewMode === "cards" && (
        <div className="flex items-center justify-between gap-4">
          <Label className="text-sm font-medium">Columns</Label>
          <Select
            value={String(columns)}
            onValueChange={next => setBookmarkColumns(pageKey, Number(next))}
          >
            <SelectTrigger className="h-7 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLUMN_OPTIONS.map(option => (
                <SelectItem
                  key={option}
                  value={String(option)}
                >
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
