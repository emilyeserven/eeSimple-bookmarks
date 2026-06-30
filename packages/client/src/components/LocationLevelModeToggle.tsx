import type { LocationMapLevelMode } from "../stores/uiStore";

import { ArrowDown, ArrowUp, Circle } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const MODE_OPTIONS: { value: LocationMapLevelMode;
  label: string;
  Icon: typeof ArrowUp; }[] = [
  {
    value: "above",
    label: "Levels above current",
    Icon: ArrowUp,
  },
  {
    value: "current",
    label: "Only current",
    Icon: Circle,
  },
  {
    value: "below",
    label: "Levels below current",
    Icon: ArrowDown,
  },
];

/**
 * The "Show:" button group in the map "Levels" overlay for a place's pages: pick whether the map
 * shows levels above the viewed place's own level, only it, or levels below it (the current level is
 * always shown). Each button carries a hover/focus label. Drives the shared
 * {@link LocationMapLevelMode}, which applies to all location maps (not bookmark maps).
 */
export function LocationLevelModeToggle({
  value,
  onChange,
}: {
  value: LocationMapLevelMode;
  onChange: (mode: LocationMapLevelMode) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold">Show:</span>
      <ToggleGroup
        type="single"
        size="sm"
        variant="outline"
        value={value}
        onValueChange={(next) => {
          if (next === "above" || next === "current" || next === "below") onChange(next);
        }}
        aria-label="Levels shown relative to the current place"
      >
        {MODE_OPTIONS.map(({
          value: optionValue, label, Icon,
        }) => (
          <Tooltip key={optionValue}>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value={optionValue}
                aria-label={label}
              >
                <Icon className="size-3" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </ToggleGroup>
    </div>
  );
}
