import type { ComboboxOption } from "./Combobox";

import { Ban, Circle, CircleDot, CircleMinus, X } from "lucide-react";

import { Badge } from "./ui/badge";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

import { cn } from "@/lib/utils";

const collapseWhenInactive = `
  w-0 min-w-0 overflow-hidden p-0 opacity-0
  transition-all duration-150
  group-hover/presence:w-7 group-hover/presence:opacity-100 group-hover/presence:p-1.5
`;

/**
 * Any / Has value / No value / Excludes selected toggle for a facet. Inactive options stay
 * collapsed until the group is hovered. `hasLabel` / `missingLabel` / `excludeLabel` name the
 * entity-specific states.
 */
export function FacetPresenceToggle({
  value, onChange, hasLabel, missingLabel, excludeLabel = "Excludes selected values",
}: {
  value: "has" | "missing" | "exclude" | undefined;
  onChange: (mode: "has" | "missing" | "exclude" | undefined) => void;
  hasLabel: string;
  missingLabel: string;
  excludeLabel?: string;
}) {
  const toggleValue = value ?? "any";
  const options = [
    {
      value: "any",
      label: "Any",
      Icon: Circle,
    },
    {
      value: "has",
      label: hasLabel,
      Icon: CircleDot,
    },
    {
      value: "missing",
      label: missingLabel,
      Icon: Ban,
    },
    {
      value: "exclude",
      label: excludeLabel,
      Icon: CircleMinus,
    },
  ] as const;

  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={toggleValue}
      onValueChange={(v) => {
        const mode = v === "any" || v === "" ? undefined : v as "has" | "missing" | "exclude";
        onChange(mode);
      }}
      className="group/presence rounded-sm ring-1 ring-border"
    >
      {options.map(({
        value: optionValue, label, Icon,
      }) => (
        <Tooltip key={optionValue}>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value={optionValue}
              aria-label={label}
              className={cn(toggleValue !== optionValue && collapseWhenInactive)}
            >
              <Icon className="size-3.5" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}

/**
 * Selected options rendered as removable chips below an image-bearing facet's combobox. Each chip
 * shows the option's `icon` (favicon/avatar) and label, with an X that deselects just that value.
 */
export function FacetChips({
  options, values, onValuesChange,
}: {
  options: ComboboxOption[];
  values: string[];
  onValuesChange: (values: string[]) => void;
}) {
  const selectedSet = new Set(values);
  const selectedOptions = options.filter(option => selectedSet.has(option.value));
  if (selectedOptions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {selectedOptions.map(option => (
        <Badge
          key={option.value}
          variant="secondary"
          className="gap-1 pr-1"
        >
          {option.icon}
          <span className="truncate">{option.label}</span>
          <button
            type="button"
            aria-label={`Remove ${option.label}`}
            className="
              rounded-sm text-muted-foreground
              hover:text-foreground
            "
            onClick={() => onValuesChange(values.filter(value => value !== option.value))}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
