import type { ViewMode } from "../lib/bookmarkColumns";

import { COLUMN_OPTIONS } from "../lib/bookmarkColumns";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/**
 * Shared "View" cards/table toggle row used by listing + section display controls. Pass
 * `showMap` to add a third "Map" option (only the Locations taxonomy opts in — it carries
 * per-item coordinates).
 */
export function ViewModeToggle({
  value, onChange, showMap = false,
}: { value: ViewMode;
  onChange: (value: ViewMode) => void;
  showMap?: boolean; }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm font-medium">View</Label>
      <ToggleGroup
        type="single"
        size="sm"
        value={value}
        className="gap-0 overflow-hidden rounded-md border border-input"
        onValueChange={(next) => {
          if (next) onChange(next as ViewMode);
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
        {showMap
          ? (
            <ToggleGroupItem
              value="map"
              className="
                rounded-none border-l border-input
                last:rounded-r-sm
              "
            >
              Map
            </ToggleGroupItem>
          )
          : null}
      </ToggleGroup>
    </div>
  );
}

/** Shared "Columns" count selector used by listing + section display controls. */
export function ColumnsSelect({
  value, onChange,
}: { value: number;
  onChange: (value: number) => void; }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm font-medium">Columns</Label>
      <Select
        value={String(value)}
        onValueChange={next => onChange(Number(next))}
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
  );
}

/** Shared On/Off two-state toggle row body (the toggle group only; caller supplies the label/wrapper). */
export function OnOffToggleGroup({
  value, onChange,
}: { value: boolean;
  onChange: (value: boolean) => void; }) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={value ? "on" : "off"}
      className="gap-0 overflow-hidden rounded-md border border-input"
      onValueChange={(next) => {
        if (next) onChange(next === "on");
      }}
    >
      <ToggleGroupItem
        value="on"
        className="
          rounded-none border-r border-input
          first:rounded-l-sm
        "
      >
        On
      </ToggleGroupItem>
      <ToggleGroupItem
        value="off"
        className="
          rounded-none
          last:rounded-r-sm
        "
      >
        Off
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
