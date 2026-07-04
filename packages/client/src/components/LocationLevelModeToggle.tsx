import type { LocationMapLevelMode } from "@eesimple/types";

import { ArrowDown, ArrowUp, Circle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
 * The "Show:" button group for a map's levels: pick whether the map shows levels above its
 * "current" level(s), only them, or levels below (the current level is always shown). Each button
 * carries a hover/focus label. A controlled {@link LocationMapLevelMode} input — the map "Levels"
 * overlay binds it to the map's persisted anchor default (the current level group's `levelMode`, or
 * the bookmark-map preference), and Settings → Locations → Level Groups binds it to each group and
 * to the bookmark-map preference directly.
 */
export function LocationLevelModeToggle({
  value,
  onChange,
}: {
  value: LocationMapLevelMode;
  onChange: (mode: LocationMapLevelMode) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold">{t("Show:")}</span>
      <ToggleGroup
        type="single"
        size="sm"
        variant="outline"
        value={value}
        onValueChange={(next) => {
          if (next === "above" || next === "current" || next === "below") onChange(next);
        }}
        aria-label={t("Levels shown relative to the current place")}
      >
        {MODE_OPTIONS.map(({
          value: optionValue, label, Icon,
        }) => (
          <Tooltip key={optionValue}>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value={optionValue}
                aria-label={t(label)}
                className={cn(
                  value === optionValue
                  && `
                    bg-primary text-primary-foreground
                    hover:bg-primary hover:text-primary-foreground
                  `,
                )}
              >
                <Icon className="size-3" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>{t(label)}</TooltipContent>
          </Tooltip>
        ))}
      </ToggleGroup>
    </div>
  );
}
