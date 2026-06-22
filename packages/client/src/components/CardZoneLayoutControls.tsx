import type {
  CardBodyZone,
  CardZoneAlign,
  CardZoneGap,
  CardZoneLayout,
  CardZoneLayouts,
  CardZoneMode,
} from "@eesimple/types";

import { CARD_BODY_ZONES, normalizeCardZoneLayout } from "@eesimple/types";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** Human labels for the four card-body sub-zones, shown beside each Flex/Grid toggle. */
const BODY_ZONE_LABELS: Record<CardBodyZone, string> = {
  "card-single-top": "Single column top",
  "card-labels": "Labels",
  "card-table": "Table",
  "card-single-bottom": "Single column bottom",
};

/** A bordered segmented toggle (one selected value out of a small option list). */
function SegmentedToggle<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { value: T;
    label: string; }[];
  onChange: (next: T) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={value}
      className="gap-0 overflow-hidden rounded-md border border-input"
      onValueChange={(next) => {
        if (next) onChange(next as T);
      }}
    >
      {options.map((opt, index) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          className={`
            rounded-none
            ${index < options.length - 1 ? "border-r border-input" : ""}
            first:rounded-l-sm
            last:rounded-r-sm
          `}
        >{opt.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

const MODE_OPTIONS: { value: CardZoneMode;
  label: string; }[] = [
  {
    value: "flex",
    label: "Flex",
  },
  {
    value: "grid",
    label: "Grid",
  },
];

const GAP_OPTIONS: { value: CardZoneGap;
  label: string; }[] = [
  {
    value: "sm",
    label: "S",
  },
  {
    value: "md",
    label: "M",
  },
  {
    value: "lg",
    label: "L",
  },
];

const ALIGN_OPTIONS: { value: CardZoneAlign;
  label: string; }[] = [
  {
    value: "start",
    label: "Start",
  },
  {
    value: "center",
    label: "Center",
  },
  {
    value: "end",
    label: "End",
  },
  {
    value: "between",
    label: "Between",
  },
];

interface CardZoneLayoutControlsProps {
  value: CardZoneLayouts;
  onChange: (layouts: CardZoneLayouts) => void;
}

/**
 * Per card-body sub-zone: a Flex/Grid mode toggle plus Gap and Alignment controls. Shared by the
 * card-display-rule editor and the homepage-section editor so both configure zone layout identically.
 */
export function CardZoneLayoutControls({
  value, onChange,
}: CardZoneLayoutControlsProps) {
  function patchZone(zone: CardBodyZone, patch: Partial<CardZoneLayout>): void {
    const current = normalizeCardZoneLayout(value[zone], zone === "card-table" ? "grid" : "flex");
    onChange({
      ...value,
      [zone]: {
        ...current,
        ...patch,
      },
    });
  }
  return (
    <div className="space-y-3">
      {CARD_BODY_ZONES.map((zone) => {
        const layout = normalizeCardZoneLayout(value[zone], zone === "card-table" ? "grid" : "flex");
        return (
          <div
            key={zone}
            className="space-y-1.5"
          >
            <span className="text-xs font-medium text-muted-foreground">{BODY_ZONE_LABELS[zone]}</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <SegmentedToggle
                value={layout.mode}
                options={MODE_OPTIONS}
                onChange={mode => patchZone(zone, {
                  mode,
                })}
              />
              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Gap</span>
                <SegmentedToggle
                  value={layout.gap ?? "md"}
                  options={GAP_OPTIONS}
                  onChange={gap => patchZone(zone, {
                    gap,
                  })}
                />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Align</span>
                <SegmentedToggle
                  value={layout.align ?? "start"}
                  options={ALIGN_OPTIONS}
                  onChange={align => patchZone(zone, {
                    align,
                  })}
                />
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}
