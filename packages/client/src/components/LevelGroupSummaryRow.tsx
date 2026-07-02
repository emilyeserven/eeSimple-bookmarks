import type { GroupRowProps, SortableHandle } from "./levelGroupRowTypes";

import { DEFAULT_LOCATION_MAP_COLOR } from "@eesimple/types";
import { ArrowDown, ArrowUp, Map as MapIcon, MapPin, Shapes, TriangleAlert } from "lucide-react";

import { LevelGroupDragHandle } from "./LevelGroupDragHandle";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LevelGroupSummaryRowProps = GroupRowProps & SortableHandle & {
  /** Switch the row into edit mode. */
  onEdit: () => void;
};

/** The collapsed (read-only) view of a level-group row: color swatch, mode/main-map pills, place types. */
export function LevelGroupSummaryRow({
  group,
  takenPlaceTypes,
  setGroupPlaceTypes,
  onEdit,
  attributes,
  listeners,
}: LevelGroupSummaryRowProps) {
  const colorSwatch = group.color ?? DEFAULT_LOCATION_MAP_COLOR;

  // A place type can end up assigned to this group AND another one (e.g. a past bug, or a race
  // between two tabs) even though the combobox normally blocks picking an already-taken option.
  // Once that's happened, `takenPlaceTypes` would otherwise make the offending option look
  // disabled forever in this group's picker too — so callers must always exempt a value already
  // present in `group.placeTypes` from the "taken" disable, or there's no way to click it off.
  const duplicatePlaceTypes = new Set(group.placeTypes.filter(pt => takenPlaceTypes.has(pt)));

  function removePlaceType(placeType: string): void {
    setGroupPlaceTypes(group.id, group.placeTypes.filter(pt => pt !== placeType));
  }

  return (
    <div className="space-y-1.5">
      {/* Row 1: summary line */}
      <div className="flex items-center gap-2">
        <LevelGroupDragHandle
          label={group.name}
          attributes={attributes}
          listeners={listeners}
        />

        <span
          className="size-4 shrink-0 rounded-sm"
          style={{
            backgroundColor: colorSwatch,
          }}
          aria-hidden="true"
        />

        <span className="flex-1 truncate text-sm font-medium">
          {group.name || <span className="text-muted-foreground italic">Unnamed level</span>}
        </span>

        <span
          className={cn(
            `
              flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs
              text-muted-foreground
            `,
          )}
        >
          {group.displayMode === "area"
            ? <Shapes className="size-3" />
            : <MapPin className="size-3" />}
          {group.displayMode === "area" ? "Area" : "Pin"}
        </span>

        {group.showOnMainMap !== false
          ? (
            <span
              className="
                flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs
                text-muted-foreground
              "
              title="Shown by default on the main map"
            >
              <MapIcon className="size-3" />
              Main map
            </span>
          )
          : null}

        {group.levelMode === "above" || group.levelMode === "below"
          ? (
            <span
              className="
                flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs
                text-muted-foreground
              "
              title={`Maps of places at this level also show the levels ${group.levelMode} it by default`}
            >
              {group.levelMode === "above"
                ? <ArrowUp className="size-3" />
                : <ArrowDown className="size-3" />}
              Shows
              {" "}
              {group.levelMode}
            </span>
          )
          : null}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
        >
          Edit
        </Button>
      </div>

      {/* Row 2: place types summary */}
      <p
        className="
          flex flex-wrap items-center gap-x-1 pl-6 text-xs text-muted-foreground
        "
      >
        {group.placeTypes.length > 0
          ? group.placeTypes.map((placeType, index) => (
            <span key={placeType}>
              {duplicatePlaceTypes.has(placeType)
                ? (
                  <button
                    type="button"
                    onClick={() => removePlaceType(placeType)}
                    className="
                      inline-flex items-center gap-0.5 font-medium
                      text-amber-600 underline decoration-dotted
                      underline-offset-2
                      hover:text-amber-700
                    "
                    title={`"${placeType}" is also assigned to another level — click to remove it from this level`}
                  >
                    <TriangleAlert className="size-3" />
                    {placeType}
                  </button>
                )
                : placeType}
              {index < group.placeTypes.length - 1 ? "," : ""}
            </span>
          ))
          : <span className="italic">No place types assigned</span>}
      </p>
    </div>
  );
}
